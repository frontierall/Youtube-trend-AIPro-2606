'use client';

import { useMemo } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import { extractKeywords, exportKeywordsToCSV } from '@/lib/reports';

interface Props {
  videos: YouTubeVideo[];
  regionCode: string;
  loading: boolean;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 animate-pulse">
      <div className="w-6 h-3 bg-gray-200 rounded flex-shrink-0" />
      <div className="w-28 h-3 bg-gray-200 rounded flex-shrink-0" />
      <div className="flex-1 h-2 bg-gray-200 rounded-full" />
      <div className="w-6 h-3 bg-gray-200 rounded flex-shrink-0" />
    </div>
  );
}

export default function KeywordAnalysis({ videos, regionCode, loading }: Props) {
  const keywords = useMemo(() => extractKeywords(videos), [videos]);
  const maxCount = keywords[0]?.count ?? 1;

  if (loading) {
    return (
      <div className="p-5 max-w-5xl space-y-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-sm">트렌딩 데이터를 먼저 불러와주세요.</p>
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
        <p className="text-sm">추출 가능한 키워드가 없습니다.</p>
      </div>
    );
  }

  const half = Math.ceil(keywords.length / 2);
  const leftCol = keywords.slice(0, half);
  const rightCol = keywords.slice(half);

  return (
    <div className="p-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm text-gray-600">
            분석 기반:{' '}
            <span className="font-semibold text-gray-900">트렌딩 {videos.length}개 영상</span>
            <span className="ml-1.5 text-gray-400 text-xs">({regionCode})</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            제목·태그에서 추출 · 키워드 {keywords.length}개 · 최다 출현:{' '}
            <span className="font-medium text-gray-600">
              {keywords[0].word} ({keywords[0].count}회)
            </span>
          </p>
        </div>
        <button
          onClick={() => exportKeywordsToCSV(videos, `키워드_${regionCode}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV 다운로드
        </button>
      </div>

      {/* Keyword grid — two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[leftCol, rightCol].map((col, ci) => (
          <div key={ci} className="space-y-1.5">
            {col.map((k, i) => {
              const rank = ci === 0 ? i + 1 : half + i + 1;
              const pct = Math.max(4, Math.round((k.count / maxCount) * 100));
              const isTop3 = rank <= 3;
              return (
                <div
                  key={k.word}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm hover:border-red-200 transition-colors"
                >
                  <span
                    className={`text-xs font-bold w-5 text-right flex-shrink-0 ${
                      isTop3 ? 'text-red-500' : 'text-gray-300'
                    }`}
                  >
                    {rank}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 w-28 truncate flex-shrink-0">
                    {k.word}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${isTop3 ? 'bg-red-400' : 'bg-gray-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-400 w-7 text-right flex-shrink-0">
                    {k.count}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
