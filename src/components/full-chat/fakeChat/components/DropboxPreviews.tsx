import type { FC, KeyboardEvent } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import styles from '../Chat.module.css';

const parseFilename = (cd: string | null): string | null => {
  if (!cd) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return utf8[1];
    }
  }
  const simple = /filename="([^"]+)"/i.exec(cd);
  if (simple?.[1]) return simple[1];
  return null;
};

const fetchDropboxObjectUrl = async (
  apiUrl: string,
): Promise<{ objectUrl: string; mime: string; filename: string | null }> => {
  const res = await fetch(apiUrl, {
    method: 'POST',
    body: new URLSearchParams({
      token: 'bbdd06a50ddcc1a4adc91fa0f6f86444',
      u_hash:
        'VLUy4+8k6JF8ZW3qvHrDZ5UDlv7DIXhU4gEQ82iRE/zCcV5iub0p1KhbBJheMe9JB95JHAXUCWclAwfoypaVkLRXyQP29NDM0NV1l//hGXKk6O43BS3TPCMgZEC4ymtr',
    }),
  });
  const mime = res.headers.get('Content-Type') || 'application/octet-stream';
  const filename = parseFilename(res.headers.get('Content-Disposition'));
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  return { objectUrl, mime, filename };
};

export const DropboxImage: FC<{
  url: string;
  alt?: string;
  style?: React.CSSProperties;
}> = ({ url, alt = '', style }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(
    url && url.startsWith('blob:') ? url : null,
  );
  const [error, setError] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let revoked = false;
    if (!url) return;
    if (url.startsWith('blob:')) {
      setImgUrl(url);
      return;
    }
    const match = url.match(/\/dropbox\/file\/(\d+)/);
    const id = match ? match[1] : null;
    if (!id) return;
    fetch(`https://ibronevik.ru/taxi/c/tutor/api/v1/dropbox/file/${id}`, {
      method: 'POST',
      body: new URLSearchParams({
        token: 'bbdd06a50ddcc1a4adc91fa0f6f86444',
        u_hash:
          'VLUy4+8k6JF8ZW3qvHrDZ5UDlv7DIXhU4gEQ82iRE/zCcV5iub0p1KhbBJheMe9JB95JHAXUCWclAwfoypaVkLRXyQP29NDM0NV1l//hGXKk6O43BS3TPCMgZEC4ymtr',
      }),
    })
      .then(async (res) => {
        const blob = await (res.blob ? res.blob() : res);
        const objectUrl = URL.createObjectURL(blob as Blob);
        urlRef.current = objectUrl;
        if (!revoked) setImgUrl(objectUrl);
      })
      .catch(() => setError(true));
    return () => {
      revoked = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [url]);

  if (error)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          color: 'red',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Ошибка загрузки фото
      </div>
    );
  if (!imgUrl)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Загрузка...
      </div>
    );
  return <img src={imgUrl} alt={alt} style={style || { width: '100%' }} />;
};

export const DropboxFilePreview: FC<{
  url: string;
  style?: React.CSSProperties;
}> = ({ url, style }) => {
  const [state, setState] = useState<{
    objectUrl: string | null;
    mime: string;
    filename: string | null;
    error: boolean;
  }>({
    objectUrl: null,
    mime: 'application/octet-stream',
    filename: null,
    error: false,
  });

  const [isOpen, setIsOpen] = useState(false);
  const objUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      try {
        if (!url) return;
        if (url.startsWith('blob:')) {
          if (!canceled) {
            setState({
              objectUrl: url,
              mime: 'application/octet-stream',
              filename: null,
              error: false,
            });
          }
          return;
        }
        const m = url.match(/\/dropbox\/file\/(\d+)/);
        const id = m?.[1];
        if (!id) {
          if (!canceled) {
            setState({
              objectUrl: url,
              mime: 'application/octet-stream',
              filename: null,
              error: false,
            });
          }
          return;
        }
        const { objectUrl, mime, filename } = await fetchDropboxObjectUrl(
          `https://ibronevik.ru/taxi/c/tutor/api/v1/dropbox/file/${id}`,
        );
        objUrlRef.current = objectUrl;
        if (!canceled) {
          setState({ objectUrl, mime, filename, error: false });
        }
      } catch (e) {
        if (!canceled) setState((s) => ({ ...s, error: true }));
      }
    };
    run();
    return () => {
      canceled = true;
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    };
  }, [url]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e as any).key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown as any);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown as any);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (state.error)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          color: 'red',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        Ошибка загрузки файла
      </div>
    );

  if (!state.objectUrl)
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          background: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        Загрузка файла...
      </div>
    );

  const mime = state.mime || '';
  const isImg = mime.startsWith('image/');
  const isVideo = mime.startsWith('video/');
  const isAudio = mime.startsWith('audio/');
  const isPdf = mime === 'application/pdf';

  if (isImg) {
    return (
      <>
        <img
          src={state.objectUrl}
          alt={state.filename || 'file'}
          style={{
            width: '100%',
            height: 120,
            objectFit: 'cover',
            borderRadius: 8,
            cursor: 'pointer',
            ...(style || {}),
          }}
          onClick={() => setIsOpen(true)}
        />

        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              cursor: 'zoom-out',
            }}
          >
            <img
              src={state.objectUrl}
              alt={state.filename || 'file'}
              style={{
                maxWidth: '95vw',
                maxHeight: '95vh',
                borderRadius: 10,
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть"
              style={{
                position: 'fixed',
                top: 16,
                right: 16,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Закрыть
            </button>
          </div>
        )}
      </>
    );
  }

  if (isVideo) {
    return (
      <video
        src={state.objectUrl}
        controls
        style={{
          width: '100%',
          height: 120,
          objectFit: 'cover',
          borderRadius: 8,
          ...(style || {}),
        }}
      />
    );
  }

  if (isAudio) {
    return (
      <audio
        src={state.objectUrl}
        controls
        style={{ width: '100%', ...(style || {}) }}
      />
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={state.objectUrl}
        title={state.filename || 'document'}
        style={{
          width: '100%',
          height: 300,
          border: 'none',
          borderRadius: 8,
          ...(style || {}),
        }}
      />
    );
  }

  return (
    <div
      style={{
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: 12,
        background: '#f6f6f6',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          overflow: 'hidden',
        }}
      >
        <img
          src="/img/chat_img/folder.png"
          alt=""
          style={{ width: 36, opacity: 0.7 }}
        />
        <div
          style={{
            fontSize: 13,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            maxWidth: 180,
          }}
          title={state.filename || 'Вложение'}
        >
          {state.filename || 'Вложение'}
        </div>
      </div>
      <a
        href={state.objectUrl}
        download={state.filename || 'file'}
        className={styles.file_link}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: '#fff',
          border: '1px solid #ddd',
        }}
      >
        Скачать
      </a>
    </div>
  );
};
