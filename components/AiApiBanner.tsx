'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  hasKey: boolean;
  onSave: (key: string) => void;
  onClose?: () => void;
}

export default function AiApiBanner({ hasKey, onSave, onClose }: Props) {
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    if (!input.trim()) {
      setError('AI API 키를 입력해주세요.');
      return;
    }
    setSaved(true);
    setTimeout(() => {
      onSave(input.trim());
      setSaved(false);
      onClose?.();
    }, 600);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">

          {/* Label */}
          <div className="flex items-center gap-2 text-amber-700 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium whitespace-nowrap">
              {hasKey ? 'AI API 키 변경' : 'AI 기능을 사용하려면 AI API 키를 입력해주세요'}
            </span>
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type={showInput ? 'text' : 'password'}
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="sk-ant-..."
                className="w-full border border-amber-300 bg-white rounded-lg px-3 py-1.5 pr-8 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 placeholder:text-gray-300"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowInput(!showInput)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showInput
                  ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                }
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={!input.trim() || saved}
              className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              {saved
                ? <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>저장됨</>
                : '저장'
              }
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 text-amber-400 hover:text-amber-600 transition-colors"
                title="닫기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {error && <p className="mt-1.5 ml-6 text-xs text-red-500">{error}</p>}

        {/* Guide — only on first setup */}
        {!hasKey && (
          <details className="mt-2 ml-6 group">
            <summary className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer select-none list-none flex items-center gap-1">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              AI API 키 발급 방법
            </summary>
            <div className="mt-1.5 ml-4 text-xs text-amber-700 space-y-1 leading-relaxed">
              <p className="font-medium">Anthropic Claude</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>console.anthropic.com 접속 후 로그인</li>
                <li>API Keys 메뉴에서 새 키 생성</li>
                <li><span className="font-mono">sk-ant-</span>로 시작하는 키를 위에 입력</li>
              </ol>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
