'use client';

import { useEffect, useState } from 'react';

const LS_KEY = 'yt_trend_api_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setApiKeyState(localStorage.getItem(LS_KEY) ?? '');
    setLoaded(true);
  }, []);

  const saveKey = (key: string) => {
    const trimmed = key.trim();
    localStorage.setItem(LS_KEY, trimmed);
    setApiKeyState(trimmed);
  };

  const clearKey = () => {
    localStorage.removeItem(LS_KEY);
    setApiKeyState('');
  };

  return { apiKey, saveKey, clearKey, loaded };
}
