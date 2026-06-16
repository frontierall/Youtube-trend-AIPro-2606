'use client';

import { useMemo } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import { formatViewCount } from '@/lib/formatters';
import { extractKeywords } from '@/lib/reports';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseSec(dur: string): number {
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] || '0') * 3600 + parseInt(m[2] || '0') * 60 + parseInt(m[3] || '0');
}

function daysDiff(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

// ── sub-components ────────────────────────────────────────────────────────────

interface BarRowProps {
  label: string;
  count: number;
  max: number;
  total: number;
  sub?: string;
  color?: string;
}
function BarRow({ label, count, max, total, sub, color = 'bg-red-400' }: BarRowProps) {
  const pct = max ? Math.max(count > 0 ? 4 : 0, (count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-32 flex-shrink-0">
        <span className="text-xs text-gray-700 leading-none">{label}</span>
        {sub && <span className="text-[10px] text-gray-400 block">{sub}</span>}
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-5 text-right">{count}</span>
      <span className="text-xs text-gray-400 w-8 text-right">
        {total ? `${Math.round(count / total * 100)}%` : ''}
      </span>
    </div>
  );
}

// ── skeleton / empty ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="p-5 max-w-5xl space-y-5 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-32 bg-gray-100 rounded-2xl" />
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
      <p className="text-sm">트렌드 탭에서 데이터를 먼저 불러와주세요.</p>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  videos: YouTubeVideo[];
  loading: boolean;
}

export default function ContentPattern({ videos, loading }: Props) {
  const stats = useMemo(() => {
    if (!videos.length) return null;

    // 인기 채널 TOP 10
    const channelMap: Record<string, { title: string; count: number; totalViews: number }> = {};
    for (const v of videos) {
      const id = v.snippet.channelId;
      const views = parseInt(v.statistics.viewCount) || 0;
      if (!channelMap[id]) channelMap[id] = { title: v.snippet.channelTitle, count: 0, totalViews: 0 };
      channelMap[id].count++;
      channelMap[id].totalViews += views;
    }
    const topChannels = Object.values(channelMap)
      .sort((a, b) => b.count - a.count || b.totalViews - a.totalViews)
      .slice(0, 10);

    // 영상 길이 구간
    const durBuckets = [
      { label: '쇼츠 (1분 미만)',  sub: '< 1min',   count: 0 },
      { label: '단편 (1~5분)',     sub: '1–5min',   count: 0 },
      { label: '중편 (5~10분)',    sub: '5–10min',  count: 0 },
      { label: '장편 (10~20분)',   sub: '10–20min', count: 0 },
      { label: '초장편 (20분+)',   sub: '20min+',   count: 0 },
    ];
    for (const v of videos) {
      const s = parseSec(v.contentDetails.duration);
      if (s < 60) durBuckets[0].count++;
      else if (s < 300) durBuckets[1].count++;
      else if (s < 600) durBuckets[2].count++;
      else if (s < 1200) durBuckets[3].count++;
      else durBuckets[4].count++;
    }

    // 업로드 시점 분포
    const ageBuckets = [
      { label: '오늘 (24시간 내)',  count: 0 },
      { label: '2~7일',           count: 0 },
      { label: '8~30일',          count: 0 },
      { label: '1~6개월',         count: 0 },
      { label: '6개월 이상',       count: 0 },
    ];
    for (const v of videos) {
      const d = daysDiff(v.snippet.publishedAt);
      if (d < 1) ageBuckets[0].count++;
      else if (d <= 7) ageBuckets[1].count++;
      else if (d <= 30) ageBuckets[2].count++;
      else if (d <= 180) ageBuckets[3].count++;
      else ageBuckets[4].count++;
    }

    // 키워드 TOP 20
    const keywords = extractKeywords(videos).slice(0, 20);

    return { topChannels, durBuckets, ageBuckets, keywords };
  }, [videos]);

  if (loading) return <Skeleton />;
  if (!stats) return <Empty />;

  const maxChannel = Math.max(...stats.topChannels.map(c => c.count), 1);
  const maxDur = Math.max(...stats.durBuckets.map(b => b.count), 1);
  const maxAge = Math.max(...stats.ageBuckets.map(b => b.count), 1);

  return (
    <div className="p-5 max-w-5xl space-y-5">
      <p className="text-sm text-gray-500">
        분석 기반: <span className="font-semibold text-gray-800">트렌딩 {videos.length}개 영상</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 인기 채널 TOP 10 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">인기 채널 TOP 10</h3>
          <div className="space-y-2.5">
            {stats.topChannels.map((c, i) => (
              <div key={c.title} className="flex items-center gap-2.5">
                <span className={`text-xs font-bold w-4 flex-shrink-0 ${i < 3 ? 'text-red-500' : 'text-gray-300'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 truncate font-medium">{c.title}</p>
                  <p className="text-[10px] text-gray-400">{formatViewCount(String(c.totalViews))} 조회</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-red-400 h-1.5 rounded-full"
                      style={{ width: `${(c.count / maxChannel) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-4 text-right">{c.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 영상 길이 분포 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">영상 길이 분포</h3>
          <div className="space-y-2.5">
            {stats.durBuckets.map(b => (
              <BarRow key={b.label} label={b.label} sub={b.sub}
                count={b.count} max={maxDur} total={videos.length} color="bg-purple-400" />
            ))}
          </div>
        </div>

        {/* 업로드 시점 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">업로드 시점 분포</h3>
          <div className="space-y-2.5">
            {stats.ageBuckets.map(b => (
              <BarRow key={b.label} label={b.label}
                count={b.count} max={maxAge} total={videos.length} color="bg-teal-400" />
            ))}
          </div>
        </div>
      </div>

      {/* 인기 키워드 */}
      {stats.keywords.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            인기 키워드 TOP {stats.keywords.length}
            <span className="ml-1.5 text-gray-400 font-normal text-xs">제목·태그 기반</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.keywords.map((k, i) => {
              const maxK = stats.keywords[0].count;
              const intensity = k.count / maxK;
              const size = intensity > 0.7 ? 'text-base' : intensity > 0.4 ? 'text-sm' : 'text-xs';
              const bg = i < 3
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-gray-100 text-gray-600 border-gray-200';
              return (
                <span
                  key={k.word}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-medium ${size} ${bg}`}
                >
                  {k.word}
                  <span className="text-[10px] opacity-60">{k.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
