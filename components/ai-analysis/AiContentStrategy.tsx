'use client';

import { useState } from 'react';
import type { YouTubeVideo } from '@/types/youtube';

interface Props {
  videos: YouTubeVideo[];
  aiApiKey: string;
  regionCode: string;
}

interface Strategy {
  recommendedTopics: string[];
  optimalLength: string;
  bestUploadTime: string;
  titleTips: string[];
  summary: string;
}

export default function AiContentStrategy({ videos, aiApiKey, regionCode }: Props) {
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Strategy | null>(null);

  const handleAnalyze = async () => {
    if (!videos.length) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/ai/content-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-api-key': aiApiKey,
        },
        body: JSON.stringify({
          regionCode,
          niche: niche.trim(),
          videos: videos.slice(0, 30).map(v => ({
            title: v.snippet.title,
            channel: v.snippet.channelTitle,
            views: v.statistics.viewCount,
            likes: v.statistics.likeCount,
            duration: v.contentDetails.duration,
            tags: v.snippet.tags?.slice(0, 5) ?? [],
            publishedAt: v.snippet.publishedAt,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 분석 실패');
      setResult(data.strategy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-4xl">
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-800">AI 콘텐츠 전략</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          트렌딩 데이터 기반으로 AI가 최적의 콘텐츠 전략을 제안합니다
        </p>
      </div>

      {/* 옵션 입력 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <p className="text-xs font-semibold text-gray-500 mb-3">분석 옵션 (선택)</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="관심 분야 입력 (예: 요리, 게임, 여행) — 비워두면 전체 분석"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !videos.length}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            {loading
              ? <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />분석 중…</span>
              : '🤖 전략 생성'
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">{error}</div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-10 h-10 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">AI가 콘텐츠 전략을 수립하고 있습니다…</p>
          <p className="text-xs text-gray-400 mt-1">약 15~30초 소요됩니다</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 추천 주제 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">🎯 추천 콘텐츠 주제</p>
              <ul className="space-y-1.5">
                {result.recommendedTopics.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-400 font-bold flex-shrink-0">{i + 1}.</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* 제목 팁 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">✏️ 제목 작성 팁</p>
              <ul className="space-y-1.5">
                {result.titleTips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-400 flex-shrink-0">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 최적 조건 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 mb-3">📐 최적 업로드 조건</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">권장 영상 길이</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{result.optimalLength}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">최적 업로드 시간</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{result.bestUploadTime}</p>
              </div>
            </div>
          </div>

          {/* AI 종합 전략 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">🤖 AI 종합 전략 제안</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
          <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-sm">
            {!videos.length
              ? '트렌드 탭에서 데이터를 먼저 불러와주세요.'
              : '관심 분야를 입력하거나 바로 전략 생성을 누르세요.'}
          </p>
        </div>
      )}
    </div>
  );
}
