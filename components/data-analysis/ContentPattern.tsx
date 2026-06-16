'use client';

import { useMemo } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import { formatViewCount } from '@/lib/formatters';

function parseSec(dur: string): number {
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] || '0') * 3600 + parseInt(m[2] || '0') * 60 + parseInt(m[3] || '0');
}

function daysDiff(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const STOP_WORDS = new Set([
  '은', '는', '이', '가', '을', '를', '의', '으로', '와', '과', '에', '에서', '도', '만', '한', '대',
  '더', '그', '저', '것', '수', '할', '하는', '있는', '없는', '있다', '없다',
  'the', 'a', 'an', 'in', 'of', 'to', 'and', 'or', 'for', 'with', 'on', 'at', 'by',
  'is', 'it', 'this', 'that', 'be', 'have', 'from', 'not', 'are', 'was', 'were',
]);

interface BarRowProps {
  label: string; sub?: string; count: number; max: number; total: number; color?: string;
}
function BarRow({ label, sub, count, max, total, color = 'bg-red-400' }: BarRowProps) {
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

function Skeleton() {
  return (
    <div className="p-5 max-w-5xl space-y-5 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
      </div>
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
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

interface Props {
  videos: YouTubeVideo[];
  loading: boolean;
  onChannelClick?: (channelId: string) => void;
}

export default function ContentPattern({ videos, loading, onChannelClick }: Props) {
  const stats = useMemo(() => {
    if (!videos.length) return null;

    const toNum = (s?: string) => parseInt(s || '0') || 0;

    // 채널 순위
    const channelMap: Record<string, { title: string; channelId: string; count: number; totalViews: number }> = {};
    for (const v of videos) {
      const id = v.snippet.channelId;
      const views = toNum(v.statistics.viewCount);
      if (!channelMap[id]) channelMap[id] = { title: v.snippet.channelTitle, channelId: id, count: 0, totalViews: 0 };
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

    // 업로드 시점
    const ageBuckets = [
      { label: '오늘 (24시간 내)', count: 0 },
      { label: '2~7일',          count: 0 },
      { label: '8~30일',         count: 0 },
      { label: '1~6개월',        count: 0 },
      { label: '6개월 이상',      count: 0 },
    ];
    for (const v of videos) {
      const d = daysDiff(v.snippet.publishedAt);
      if (d < 1) ageBuckets[0].count++;
      else if (d <= 7) ageBuckets[1].count++;
      else if (d <= 30) ageBuckets[2].count++;
      else if (d <= 180) ageBuckets[3].count++;
      else ageBuckets[4].count++;
    }

    // #11 업로드 요일 분포
    const dayBuckets = DAYS.map((label, idx) => ({
      label,
      count: videos.filter(v => new Date(v.snippet.publishedAt).getDay() === idx).length,
    }));

    // #12 키워드 + 평균 조회수
    const kwMap: Record<string, { count: number; totalViews: number }> = {};
    for (const v of videos) {
      const views = toNum(v.statistics.viewCount);
      const words = v.snippet.title
        .split(/[\s|,\-\[\]()#!?~.·\\/+:]+/)
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
      for (const word of words) {
        if (!kwMap[word]) kwMap[word] = { count: 0, totalViews: 0 };
        kwMap[word].count++;
        kwMap[word].totalViews += views;
      }
      if (v.snippet.tags) {
        for (const tag of v.snippet.tags) {
          const t = tag.toLowerCase().trim();
          if (t.length > 1 && !STOP_WORDS.has(t)) {
            if (!kwMap[t]) kwMap[t] = { count: 0, totalViews: 0 };
            kwMap[t].count++;
            kwMap[t].totalViews += views;
          }
        }
      }
    }
    const kwWithViews = Object.entries(kwMap)
      .filter(([, v]) => v.count >= 2)
      .map(([word, v]) => ({ word, count: v.count, avgViews: v.totalViews / v.count }))
      .sort((a, b) => b.count - a.count || b.avgViews - a.avgViews)
      .slice(0, 20);

    // #13 제목 길이 분석
    const titleGroups = [
      { label: '짧음', sub: '~20자', items: [] as number[] },
      { label: '보통', sub: '21~40자', items: [] as number[] },
      { label: '긺',  sub: '41자+', items: [] as number[] },
    ];
    for (const v of videos) {
      const len = v.snippet.title.length;
      const views = toNum(v.statistics.viewCount);
      if (len <= 20) titleGroups[0].items.push(views);
      else if (len <= 40) titleGroups[1].items.push(views);
      else titleGroups[2].items.push(views);
    }
    const titleLengthStats = titleGroups.map(g => ({
      label: g.label,
      sub: g.sub,
      count: g.items.length,
      avgViews: g.items.length ? g.items.reduce((a, b) => a + b, 0) / g.items.length : 0,
    }));

    return { topChannels, durBuckets, ageBuckets, dayBuckets, kwWithViews, titleLengthStats };
  }, [videos]);

  if (loading) return <Skeleton />;
  if (!stats) return <Empty />;

  const maxChannel = Math.max(...stats.topChannels.map(c => c.count), 1);
  const maxDur = Math.max(...stats.durBuckets.map(b => b.count), 1);
  const maxAge = Math.max(...stats.ageBuckets.map(b => b.count), 1);
  const maxDay = Math.max(...stats.dayBuckets.map(b => b.count), 1);
  const maxTitleViews = Math.max(...stats.titleLengthStats.map(t => t.avgViews), 1);

  return (
    <div className="p-5 max-w-5xl space-y-5">
      <p className="text-sm text-gray-500">
        분석 기반: <span className="font-semibold text-gray-800">트렌딩 {videos.length}개 영상</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 인기 채널 TOP 10 — #14 클릭 시 채널 분석 이동 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">인기 채널 TOP 10</h3>
          {onChannelClick && (
            <p className="text-xs text-gray-400 mb-3">채널명 클릭 → 채널 분석</p>
          )}
          <div className="space-y-2.5">
            {stats.topChannels.map((c, i) => (
              <div key={c.channelId} className="flex items-center gap-2.5">
                <span className={`text-xs font-bold w-4 flex-shrink-0 ${i < 3 ? 'text-red-500' : 'text-gray-300'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => onChannelClick?.(c.channelId)}
                    className={`text-xs text-left font-medium truncate w-full leading-tight
                      ${onChannelClick
                        ? 'text-gray-800 hover:text-red-600 cursor-pointer transition-colors'
                        : 'text-gray-800 cursor-default'}`}
                    disabled={!onChannelClick}
                  >
                    {c.title}
                  </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* #11 업로드 요일 분포 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">업로드 요일 분포</h3>
          <p className="text-xs text-gray-400 mb-4">어느 요일에 올린 영상이 트렌딩에 많이 진입했는가</p>
          <div className="flex items-end gap-1.5 h-20">
            {stats.dayBuckets.map(b => {
              const pct = maxDay ? (b.count / maxDay) * 100 : 0;
              const isWeekend = b.label === '토' || b.label === '일';
              return (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[11px] font-medium text-gray-600 h-4">
                    {b.count > 0 ? b.count : ''}
                  </span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '52px' }}>
                    <div
                      className={`w-full rounded-t-sm ${isWeekend ? 'bg-blue-400' : 'bg-orange-400'}`}
                      style={{ height: `${Math.max(pct, b.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isWeekend ? 'text-blue-500' : 'text-gray-500'}`}>
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400" />평일
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" />주말
            </span>
          </div>
        </div>

        {/* #13 제목 길이 분석 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">제목 길이 분석</h3>
          <p className="text-xs text-gray-400 mb-3">제목 길이별 영상 수와 평균 조회수 비교</p>
          <div className="space-y-3">
            {stats.titleLengthStats.map(t => (
              <div key={t.label}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-medium text-gray-700">{t.label}</span>
                    <span className="text-[10px] text-gray-400 ml-1.5">{t.sub}</span>
                    <span className="text-[10px] text-gray-400 ml-1.5">({t.count}개)</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">
                    평균 {formatViewCount(String(Math.round(t.avgViews)))}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-400 h-2 rounded-full"
                    style={{ width: `${maxTitleViews ? Math.max(4, (t.avgViews / maxTitleViews) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* #12 인기 키워드 + 평균 조회수 */}
      {stats.kwWithViews.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            인기 키워드 TOP {stats.kwWithViews.length}
          </h3>
          <p className="text-xs text-gray-400 mb-3">출현 빈도 · 숫자는 해당 키워드 영상들의 평균 조회수</p>
          <div className="flex flex-wrap gap-2">
            {stats.kwWithViews.map((k, i) => {
              const maxK = stats.kwWithViews[0].count;
              const intensity = k.count / maxK;
              const size = intensity > 0.7 ? 'text-base' : intensity > 0.4 ? 'text-sm' : 'text-xs';
              const isTop3 = i < 3;
              return (
                <div
                  key={k.word}
                  className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border ${
                    isTop3 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className={`font-semibold leading-tight ${size} ${isTop3 ? 'text-red-700' : 'text-gray-700'}`}>
                    {k.word}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {k.count}회 · {formatViewCount(String(Math.round(k.avgViews)))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
