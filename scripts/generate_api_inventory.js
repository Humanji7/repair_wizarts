#!/usr/bin/env node
/**
 * Scan src for HTTP calls and generate docs/api/inventory.json per Spec1 Task1.
 * Captures: file, fn (best-effort surrounding function/component), verb, path,
 * params/body, headers, needsAuth, errorHandling, featureOwner (inferred by folder).
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const OUT_PATH = path.join(ROOT, 'docs', 'api', 'inventory.json');

/** Utility: read all text files under src */
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (/\.(js|jsx|ts|tsx)$/i.test(e.name)) files.push(full);
  }
  return files;
}

function readFileSafe(fp) {
  try { return fs.readFileSync(fp, 'utf8'); } catch { return ''; }
}

/** crude parser helpers */
function inferFeatureOwner(filePath) {
  const rel = path.relative(SRC_DIR, filePath);
  const seg = rel.split(path.sep)[0];
  return seg || 'src';
}
function inferFnName(content, index) {
  // look backwards for nearest function/component declaration
  const start = Math.max(0, index - 800);
  const snippet = content.slice(start, index);
  const patterns = [
    /function\s+(\w+)/,
    /const\s+(\w+)\s*=\s*\(/,
    /export\s+function\s+(\w+)/,
    /export\s+const\s+(\w+)\s*=\s*\(/,
    /class\s+(\w+)/,
  ];
  for (const re of patterns) {
    const m = snippet.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractInitObject(content, startIdx) {
  // naive brace matching to get init object following comma in appFetch(url, init)
  const openIdx = content.indexOf('{', startIdx);
  if (openIdx === -1) return null;
  let depth = 0;
  for (let i = openIdx; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return content.slice(openIdx, i + 1);
      }
    }
  }
  return null;
}

function parseInit(initStr) {
  if (!initStr) return {};
  // very naive parse; attempt JSON-ish cleanup
  try {
    let jsonLike = initStr
      .replace(/([\w$]+)\s*:/g, '"$1":')
      .replace(/'/g, '"');
    return JSON.parse(jsonLike);
  } catch {
    return { raw: initStr };
  }
}

function detectNeedsAuth(initObj) {
  // From appFetch.js, token added to body when token exists.
  // We detect explicit admin flag in third argument or presence of token fields.
  if (initObj && initObj.body) return true;
  return false;
}

function detectErrorHandling(content, callIdx) {
  // Look ahead for catch or reject usage
  const after = content.slice(callIdx, callIdx + 300);
  if (/catch\(/.test(after) || /Promise\.reject/.test(after)) return 'local';
  return 'implicit appFetch';
}

function findAppFetchCalls(content) {
  const results = [];
  const re = /appFetch\s*\(([^\)]*)\)/g;
  let m;
  while ((m = re.exec(content))) {
    const call = m[0];
    const args = m[1];
    const idx = m.index;
    // url/path as first arg (string literal best-effort)
    const pathMatch = args.match(/['"]([^'"]+)['"]/);
    const pathArg = pathMatch ? pathMatch[1] : null;
    // init object best-effort: after first comma
    const commaIdx = content.indexOf(',', idx);
    const initStr = commaIdx !== -1 ? extractInitObject(content, commaIdx + 1) : null;
    const initObj = parseInit(initStr);
    // verb
    const verb = initObj.method || (initObj && initObj.raw && /method\s*:\s*['"][A-Z]+['"]/i.test(initObj.raw) ? initObj.raw.match(/method\s*:\s*['"](\w+)['"]/i)[1] : 'POST');
    results.push({ idx, pathArg, initObj, verb });
  }
  return results;
}

function findRawFetchCalls(content) {
  const results = [];
  const re = /fetch\s*\(([^\)]*)\)/g;
  let m;
  while ((m = re.exec(content))) {
    const idx = m.index;
    const args = m[1];
    const pathMatch = args.match(/['"]([^'"]+)['"]/);
    const pathArg = pathMatch ? pathMatch[1] : null;
    const commaIdx = content.indexOf(',', idx);
    const initStr = commaIdx !== -1 ? extractInitObject(content, commaIdx + 1) : null;
    const initObj = parseInit(initStr);
    const verb = initObj.method || 'GET';
    results.push({ idx, pathArg, initObj, verb });
  }
  return results;
}

function main() {
  const files = walk(SRC_DIR);
  const items = [];

  for (const fp of files) {
    const content = readFileSafe(fp);
    if (!content) continue;

    const appFetchCalls = findAppFetchCalls(content);
    const rawFetchCalls = findRawFetchCalls(content);
    const featureOwner = inferFeatureOwner(fp);

    for (const c of appFetchCalls) {
      const fn = inferFnName(content, c.idx);
      items.push({
        source: 'appFetch',
        file: path.relative(ROOT, fp),
        fn,
        verb: c.verb,
        path: c.pathArg,
        paramsOrBody: c.initObj?.body || null,
        headers: c.initObj?.headers || null,
        needsAuth: detectNeedsAuth(c.initObj),
        errorHandling: detectErrorHandling(content, c.idx),
        featureOwner,
      });
    }

    for (const c of rawFetchCalls) {
      const fn = inferFnName(content, c.idx);
      items.push({
        source: 'fetch',
        file: path.relative(ROOT, fp),
        fn,
        verb: c.verb,
        path: c.pathArg,
        paramsOrBody: c.initObj?.body || null,
        headers: c.initObj?.headers || null,
        needsAuth: !!(c.initObj?.headers && (c.initObj.headers.Authorization || c.initObj.headers.authorization)),
        errorHandling: detectErrorHandling(content, c.idx),
        featureOwner,
      });
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2));
  console.log(`Generated ${OUT_PATH} with ${items.length} entries.`);
}

main();
