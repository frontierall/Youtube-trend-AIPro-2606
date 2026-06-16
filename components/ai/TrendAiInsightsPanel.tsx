'use client';

import { useEffect, useMemo, useState } from 'react';
import { YouTubeCategory, YouTubeVideo } from '@/types/youtube';

export interface TrendInsight {
  summary: string;
  topics: string[];
  repeatedKeywords: string[];
  risingCategories: string[];
  contentIdeas: string[];
  selectedVideoInsight: string;
}

interface Props {
  videos: YouTubeVideo[];
  selectedVideo: YouTubeVideo | null;
  categories: YouTubeCategory[];
  regionCode: string;
  categoryId: string;
  openAiApiKey: string;
  model: string;
  language: 'ko' | 'en';
  saveAnalysis: boolean;
  loading: boolean;
  onOpenSettings: () => void;
  onClearSelectedVideo: () => void;
}

const SAVED_INSIGHT_KEY = 'yt_trend_last_ai_insight';

export default function TrendAiInsightsPanel({
  videos,
  selectedVideo,
  categories,
  regionCode,
  categoryId,
  openAiApiKey,
  model,
  language,
  saveAnalysis,
  loading,
  onOpenSettings,
  onClearSelectedVideo,
}: Props) {
  const [insight, setInsight] = useState<TrendInsight | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.snippet.title]));
  }, [categories]);

  const currentCategoryTitle = categoryId ? categoryMap.get(categoryId) ?? categoryId : '전체';
  const canAnalyze = !!openAiApiKey && videos.length > 0 && !loading;

  useEffect(() => {
    if (!saveAnalysis || insight) return;
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(SAVED_INSIGHT_KEY);
        if (!raw) return;
        setInsight(JSON.parse(raw).insight as TrendInsight);
      } catch {
        localStorage.removeItem(SAVED_INSIGHT_KEY);
      }
    });
  }, [insight, saveAnalysis]);

  const buildPayloadVideos = () => {
    return videos.slice(0, 100).map((video, index) => ({
      rank: index + 1,
      id: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      categoryTitle: categoryMap.get(video.snippet.categoryId) ?? video.snippet.categoryId,
      publishedAt: video.snippet.publishedAt,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      tags: video.snippet.tags?.slice(0, 8),
    }));
  };

  const analyze = async (mode: 'all' | 'selected') => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch('/api/ai/trend-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openai-api-key': openAiApiKey,
        },
        body: JSON.stringify({
          model,
          language,
          regionCode,
          categoryTitle: currentCategoryTitle,
          mode,
          selectedVideoId: mode === 'selected' ? selectedVideo?.id : undefined,
          videos: buildPayloadVideos(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 분석에 실패했습니다.');

      setInsight(data.insight);
      if (saveAnalysis) {
        localStorage.setItem(SAVED_INSIGHT_KEY, JSON.stringify({
          insight: data.insight,
          analyzedAt: new Date().toISOString(),
          model,
          regionCode,
          categoryTitle: currentCategoryTitle,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석에 실패했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyInsight = async () => {
    if (!insight) return;
    const text = [
      `AI 트렌드 인사이트 (${regionCode} · ${currentCategoryTitle})`,
      '',
      insight.summary,
      '',
      '[오늘 뜨는 주제]',
      ...insight.topics.map((item) => `- ${item}`),
      '',
      '[반복 키워드]',
      insight.repeatedKeywords.join(', '),
      '',
      '[급상승 카테고리]',
      ...insight.risingCategories.map((item) => `- ${item}`),
      '',
      '[콘텐츠 기획 힌트]',
      ...insight.contentIdeas.map((item) => `- ${item}`),
      selectedVideo ? ['', '[선택 영상 분석]', insight.selectedVideoInsight].join('\n') : '',
    ].filter(Boolean).join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <aside className="w-full xl:w-[360px] xl:flex-shrink-0">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm xl:sticky xl:top-20 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">AI 인사이트</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {regionCode} · {currentCategoryTitle} · TOP {Math.min(videos.length, 100)}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
            {model}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {!openAiApiKey && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-3">
              <p className="text-sm font-medium text-amber-800">OpenAI API 키가 필요합니다.</p>
              <button
                onClick={onOpenSettings}
                className="mt-2 text-xs font-semibold text-amber-700 underline underline-offset-2"
              >
                설정에서 등록하기
              </button>
            </div>
          )}

          {selectedVideo && (
            <div className="border border-blue-100 bg-blue-50 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700">선택 영상 반영</p>
                  <p className="text-sm font-medium text-blue-950 line-clamp-2 mt-1">
                    {selectedVideo.snippet.title}
                  </p>
                </div>
                <button
                  onClick={onClearSelectedVideo}
                  className="text-blue-400 hover:text-blue-700"
                  title="선택 해제"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => analyze('all')}
              disabled={!canAnalyze || analyzing}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              {analyzing ? '분석 중...' : '전체 분석'}
            </button>
            <button
              onClick={() => analyze('selected')}
              disabled={!canAnalyze || analyzing || !selectedVideo}
              className="border border-gray-200 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              선택 영상 분석
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!insight && !error && (
            <div className="py-8 text-center text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <p className="text-sm">영상 목록을 불러온 뒤 AI 분석을 실행하세요.</p>
            </div>
          )}

          {insight && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
              </div>

              <InsightList title="오늘 뜨는 주제" items={insight.topics} />
              <KeywordList title="반복 키워드" items={insight.repeatedKeywords} />
              <InsightList title="급상승 카테고리" items={insight.risingCategories} />
              <InsightList title="콘텐츠 기획 힌트" items={insight.contentIdeas} />

              {selectedVideo && insight.selectedVideoInsight && (
                <div className="border-t border-gray-100 pt-3">
                  <h3 className="text-xs font-bold text-gray-500 mb-2">선택 영상 분석</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{insight.selectedVideoInsight}</p>
                </div>
              )}

              <button
                onClick={copyInsight}
                className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                {copied ? '복사됨' : '인사이트 복사'}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-gray-700 leading-snug flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeywordList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
