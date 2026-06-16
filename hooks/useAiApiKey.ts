'use client';

import { useEffect, useState } from 'react';

const LS_KEY = 'yt_trend_ai_key';

export function useAiApiKey() {
  const [aiApiKey, setAiApiKeyState] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setAiApiKeyState(localStorage.getItem(LS_KEY) ?? '');
      setLoaded(true);
    });
  }, []);

  const saveKey = (key: string) => {
    const trimmed = key.trim();
    localStorage.setItem(LS_KEY, trimmed);
    setAiApiKeyState(trimmed);
  };

  const clearKey = () => {
    localStorage.removeItem(LS_KEY);
    setAiApiKeyState('');
  };

  return { aiApiKey, saveKey, clearKey, loaded };
}
