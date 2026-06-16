'use client';

import { useState } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import { formatViewCount } from '@/lib/formatters';

interface Props {
  videos: YouTubeVideo[];
  aiApiKey: string;
  regionCode: string;
}

export default function AiTrendSummary({ videos, aiApiKey, regionCode }: Props) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!videos.length) return;
    setLoading(true);
    setError('');
    setSummary('');

    try {
      const res = await fetch('/api/ai/trend-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-api-key': aiApiKey,
        },
        body: JSON.stringify({
          regionCode,
          videos: videos.slice(0, 30).map(v => ({
            title: v.snippet.title,
            channel: v.snippet.channelTitle,
            views: v.statistics.viewCount,
            likes: v.statistics.likeCount,
            tags: v.snippet.tags?.slice(0, 5) ?? [],
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 분석 실패');
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-4xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-800">AI 트렌드 요약</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            현재 트렌딩 {videos.length}개 영상을 AI가 분석하여 핵심 트렌드를 요약합니다
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !videos.length}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {loading
            ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />분석 중…</>
            : <><span>🤖</span> AI 분석 시작</>
          }
        </button>
      </div>

      {/* 분석 대상 미리보기 */}
      {!summary && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">분석 대상 TOP 5 미리보기</p>
          <div className="space-y-2">
            {videos.slice(0, 5).map((v, i) => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{v.snippet.title}</p>
                  <p className="text-[11px] text-gray-400">{v.snippet.channelTitle} · {formatViewCount(v.statistics.viewCount)} 조회</p>
                </div>
              </div>
            ))}
            {videos.length > 5 && (
              <p className="text-xs text-gray-400 pl-7">외 {videos.length - 5}개 영상 포함</p>
            )}
          </div>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-10 h-10 border-4 border-red-100 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">AI가 트렌드를 분석하고 있습니다…</p>
          <p className="text-xs text-gray-400 mt-1">약 10~20초 소요됩니다</p>
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 결과 */}
      {summary && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <span className="text-lg">🤖</span>
            <p className="text-sm font-semibold text-gray-800">AI 트렌드 분석 결과</p>
            <span className="ml-auto text-xs text-gray-400">{regionCode} 기준</span>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>
        </div>
      )}

      {!videos.length && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
          <p className="text-sm">트렌드 탭에서 데이터를 먼저 불러와주세요.</p>
        </div>
      )}
    </div>
  );
}
