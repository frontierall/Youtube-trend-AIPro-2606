'use client';

import { useEffect, useState } from 'react';
import { COUNTRIES } from '@/components/FilterBar';
import { YouTubeCategory } from '@/types/youtube';

export interface AppSettings {
  defaultRegionCode: string;
  defaultCategoryId: string;
  commentLimit: number;
  saveTrendData: boolean;
  language: string;
  openAiApiKey: string;
  aiModel: 'gpt-5.4-mini' | 'gpt-5.4' | 'gpt-5.5';
  aiLanguage: 'ko' | 'en';
  saveAiAnalysis: boolean;
}

const SETTINGS_KEY = 'yt_trend_app_settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultRegionCode: 'KR',
  defaultCategoryId: '',
  commentLimit: 50,
  saveTrendData: false,
  language: 'ko',
  openAiApiKey: '',
  aiModel: 'gpt-5.4-mini',
  aiLanguage: 'ko',
  saveAiAnalysis: false,
};

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_APP_SETTINGS;

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;

    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

interface Props {
  apiKey: string;
  categories: YouTubeCategory[];
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onSaveApiKey: (key: string) => void;
  onClearApiKey: () => void;
}

export default function SettingsPage({
  apiKey,
  categories,
  settings,
  onSettingsChange,
  onSaveApiKey,
  onClearApiKey,
}: Props) {
  const [draftKey, setDraftKey] = useState('');
  const [draftOpenAiKey, setDraftOpenAiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');
  const [openAiMessage, setOpenAiMessage] = useState('');

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  const updateSettings = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleSaveKey = () => {
    const trimmed = draftKey.trim();
    if (!trimmed) {
      setKeyMessage('API 키를 입력해주세요.');
      return;
    }
    if (!trimmed.startsWith('AIza')) {
      setKeyMessage('YouTube Data API 키는 보통 AIza로 시작합니다.');
      return;
    }

    onSaveApiKey(trimmed);
    setDraftKey('');
    setKeyMessage('API 키가 저장되었습니다.');
  };

  const handleClearKey = () => {
    onClearApiKey();
    setDraftKey('');
    setKeyMessage('저장된 API 키를 삭제했습니다.');
  };

  const handleSaveOpenAiKey = () => {
    const trimmed = draftOpenAiKey.trim();
    if (!trimmed) {
      setOpenAiMessage('OpenAI API 키를 입력해주세요.');
      return;
    }
    if (!trimmed.startsWith('sk-')) {
      setOpenAiMessage('OpenAI API 키는 보통 sk-로 시작합니다.');
      return;
    }

    updateSettings('openAiApiKey', trimmed);
    setDraftOpenAiKey('');
    setOpenAiMessage('OpenAI API 키가 저장되었습니다.');
  };

  const handleClearOpenAiKey = () => {
    updateSettings('openAiApiKey', '');
    setDraftOpenAiKey('');
    setOpenAiMessage('저장된 OpenAI API 키를 삭제했습니다.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">설정</h2>
        <p className="text-sm text-gray-500 mt-1">API와 기본 조회 옵션을 관리합니다.</p>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">API 설정</h3>
            <p className="text-sm text-gray-500 mt-1">YouTube Data API 키를 저장하거나 교체합니다.</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${apiKey ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {apiKey ? '등록됨' : '미등록'}
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={draftKey}
              onChange={(e) => {
                setDraftKey(e.target.value);
                setKeyMessage('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              placeholder={apiKey ? '새 API 키 입력' : 'AIzaSy...'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title={showKey ? '숨기기' : '보기'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showKey ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A10.3 10.3 0 0112 4.86c4.48 0 8.27 2.94 9.54 7a9.98 9.98 0 01-3.07 4.64M6.61 6.61A10.02 10.02 0 002.46 11.86a10 10 0 006.01 6.01" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7z" />
                  </>
                )}
              </svg>
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            저장
          </button>
          {apiKey && (
            <button
              onClick={handleClearKey}
              className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              삭제
            </button>
          )}
        </div>
        {keyMessage && <p className="text-xs text-gray-500 mt-2">{keyMessage}</p>}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">OpenAI 설정</h3>
            <p className="text-sm text-gray-500 mt-1">트렌드 인사이트 생성에 사용할 AI 옵션입니다.</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${settings.openAiApiKey ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {settings.openAiApiKey ? '등록됨' : '미등록'}
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type={showOpenAiKey ? 'text' : 'password'}
              value={draftOpenAiKey}
              onChange={(e) => {
                setDraftOpenAiKey(e.target.value);
                setOpenAiMessage('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveOpenAiKey()}
              placeholder={settings.openAiApiKey ? '새 OpenAI API 키 입력' : 'sk-...'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowOpenAiKey(!showOpenAiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title={showOpenAiKey ? '숨기기' : '보기'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showOpenAiKey ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A10.3 10.3 0 0112 4.86c4.48 0 8.27 2.94 9.54 7a9.98 9.98 0 01-3.07 4.64M6.61 6.61A10.02 10.02 0 002.46 11.86a10 10 0 006.01 6.01" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7z" />
                  </>
                )}
              </svg>
            </button>
          </div>
          <button
            onClick={handleSaveOpenAiKey}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            저장
          </button>
          {settings.openAiApiKey && (
            <button
              onClick={handleClearOpenAiKey}
              className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              삭제
            </button>
          )}
        </div>
        {openAiMessage && <p className="text-xs text-gray-500 mt-2">{openAiMessage}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <SettingField label="기본 AI 모델">
            <select
              value={settings.aiModel}
              onChange={(e) => updateSettings('aiModel', e.target.value as AppSettings['aiModel'])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            >
              <option value="gpt-5.4-mini">gpt-5.4-mini - 빠른 기본 분석</option>
              <option value="gpt-5.4">gpt-5.4 - 정밀 분석</option>
              <option value="gpt-5.5">gpt-5.5 - 고급 리포트</option>
            </select>
          </SettingField>

          <SettingField label="AI 분석 언어">
            <select
              value={settings.aiLanguage}
              onChange={(e) => updateSettings('aiLanguage', e.target.value as AppSettings['aiLanguage'])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </SettingField>
        </div>

        <label className="flex items-center justify-between gap-4 cursor-pointer mt-5 border-t border-gray-100 pt-4">
          <span>
            <span className="block text-sm font-medium text-gray-800">AI 분석 저장</span>
            <span className="block text-xs text-gray-500 mt-1">마지막 트렌드 인사이트를 브라우저에 보관합니다.</span>
          </span>
          <input
            type="checkbox"
            checked={settings.saveAiAnalysis}
            onChange={(e) => updateSettings('saveAiAnalysis', e.target.checked)}
            className="w-5 h-5 accent-red-500"
          />
        </label>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">기본 조회 옵션</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingField label="기본 국가">
            <select
              value={settings.defaultRegionCode}
              onChange={(e) => updateSettings('defaultRegionCode', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </SettingField>

          <SettingField label="기본 카테고리">
            <select
              value={settings.defaultCategoryId}
              onChange={(e) => updateSettings('defaultCategoryId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            >
              <option value="">전체</option>
              {categories
                .filter((category) => category.snippet.assignable)
                .map((category) => (
                  <option key={category.id} value={category.id}>{category.snippet.title}</option>
                ))}
            </select>
          </SettingField>

          <SettingField label="댓글 수집 개수">
            <select
              value={settings.commentLimit}
              onChange={(e) => updateSettings('commentLimit', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            >
              <option value={25}>25개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>
          </SettingField>

          <SettingField label="언어">
            <select
              value={settings.language}
              onChange={(e) => updateSettings('language', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </SettingField>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">데이터 저장</h3>
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span>
            <span className="block text-sm font-medium text-gray-800">트렌드 스냅샷 저장</span>
            <span className="block text-xs text-gray-500 mt-1">주간 트렌드 분석용 누적 저장 옵션입니다. DB 연동 후 실제 저장에 사용됩니다.</span>
          </span>
          <input
            type="checkbox"
            checked={settings.saveTrendData}
            onChange={(e) => updateSettings('saveTrendData', e.target.checked)}
            className="w-5 h-5 accent-red-500"
          />
        </label>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2">API quota 사용량</h3>
        <p className="text-sm text-gray-500">
          YouTube Data API의 실제 일일 quota 사용량은 Google Cloud Console에서 확인해야 합니다.
          이 앱에서는 요청별 예상 비용을 기준으로 추정 표시 기능을 붙일 수 있습니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <QuotaBox label="트렌딩 조회" value="약 1 unit" />
          <QuotaBox label="카테고리 조회" value="약 1 unit" />
          <QuotaBox label="댓글 조회" value="약 1 unit/page" />
        </div>
      </section>
    </div>
  );
}

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function QuotaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
