'use client';

import { useState } from 'react';

interface Props {
  aiApiKey: string;
  apiKey: string;
}

function extractVideoId(input: string): string | null {
  const short = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const long = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return null;
}

interface SentimentResult {
  overall: string;
  positive: number;
  negative: number;
  neutral: number;
  themes: string[];
  summary: string;
}

export default function AiCommentAnalysis({ aiApiKey, apiKey }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [videoTitle, setVideoTitle] = useState('');

  const handleAnalyze = async () => {
    const videoId = extractVideoId(query.trim());
    if (!videoId) {
      setError('올바른 YouTube 영상 URL 또는 영상 ID(11자리)를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/ai/comment-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-api-key': aiApiKey,
          'x-youtube-api-key': apiKey,
        },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 분석 실패');
      setResult(data.result);
      setVideoTitle(data.videoTitle ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sentimentColor = (label: string) =>
    label === '긍정' ? 'text-green-600' : label === '부정' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="p-5 max-w-4xl">
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-800">AI 댓글 분석</h2>
        <p className="text-xs text-gray-400 mt-0.5">영상 댓글의 감성과 주요 반응을 AI가 분석합니다</p>
      </div>

      {/* 검색 */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="YouTube 영상 URL 또는 영상 ID 입력"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
        />
        <button
          onClick={handleAnalyze}
          disabled={!query.trim() || loading}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? '분석 중…' : '🤖 AI 분석'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">{error}</div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-10 h-10 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">댓글을 불러와 AI가 분석하고 있습니다…</p>
          <p className="text-xs text-gray-400 mt-1">약 15~30초 소요됩니다</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {videoTitle && (
            <p className="text-sm font-semibold text-gray-700 truncate">📹 {videoTitle}</p>
          )}

          {/* 전체 감성 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">전체 감성</p>
            <p className={`text-2xl font-bold ${sentimentColor(result.overall)}`}>{result.overall}</p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: '긍정', value: result.positive, color: 'bg-green-400' },
                { label: '중립', value: result.neutral, color: 'bg-gray-300' },
                { label: '부정', value: result.negative, color: 'bg-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                    <div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-bold text-gray-800">{value}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 테마 */}
          {result.themes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">주요 반응 테마</p>
              <div className="flex flex-wrap gap-2">
                {result.themes.map(t => (
                  <span key={t} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI 요약 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">🤖 AI 종합 분석</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
          <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">YouTube 영상 URL이나 영상 ID를 입력해 분석을 시작하세요.</p>
        </div>
      )}
    </div>
  );
}
