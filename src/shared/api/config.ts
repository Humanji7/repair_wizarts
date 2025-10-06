// Centralized config loader; maps to env process.env when needed.
export function getConfigValue(key: string): string | undefined {
  const map: Record<string, string | undefined> = {
    'react-app.api.url': process.env.REACT_APP_API_URL,
  };
  return map[key];
}
