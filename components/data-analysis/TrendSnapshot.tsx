'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import type { YouTubeVideo } from '@/types/youtube';
import { formatViewCount, formatDuration } from '@/lib/formatters';

function parseSec(dur: string): number {
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] || '0') * 3600 + parseInt(m[2] || '0') * 60 + parseInt(m[3] || '0');
}

function secToLabel(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}분 ${s}초`;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface KpiCardProps { label: string; value: string; sub?: string; accent?: boolean }
function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className={`rounded-2xl p-4 border shadow-sm ${accent ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold leading-tight ${accent ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

interface BarRowProps { label: string; count: number; max: number; total: number; color?: string }
function BarRow({ label, count, max, total, color = 'bg-red-400' }: BarRowProps) {
  const pct = max ? Math.max(4, (count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-gray-600 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-5 text-right">{count}</span>
      <span className="text-xs text-gray-400 w-9 text-right">{total ? `${Math.round(count / total * 100)}%` : ''}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-5 max-w-5xl space-y-5 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">트렌드 탭에서 데이터를 먼저 불러와주세요.</p>
    </div>
  );
}

interface Props {
  videos: YouTubeVideo[];
  eduVideos: YouTubeVideo[];
  regionCode: string;
  loading: boolean;
}

export default function TrendSnapshot({ videos, eduVideos, regionCode, loading }: Props) {
  const stats = useMemo(() => {
    if (!videos.length) return null;

    const toNum = (s?: string) => parseInt(s || '0') || 0;
    const viewArr = videos.map(v => toNum(v.statistics.viewCount));
    const durArr = videos.map(v => parseSec(v.contentDetails.duration));

    const totalViews = viewArr.reduce((a, b) => a + b, 0);
    const avgViews = totalViews / videos.length;

    const sorted = [...viewArr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianViews = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    const likeRates = viewArr.map((v, i) => v ? toNum(videos[i].statistics.likeCount) / v * 100 : 0);
    const avgLikeRate = likeRates.reduce((a, b) => a + b, 0) / videos.length;
    const avgCommentRate = viewArr
      .map((v, i) => v ? toNum(videos[i].statistics.commentCount) / v * 100 : 0)
      .reduce((a, b) => a + b, 0) / videos.length;
    const avgDurSec = durArr.reduce((a, b) => a + b, 0) / videos.length;

    const viewBuckets = [
      { label: '1억 이상',     count: viewArr.filter(v => v >= 100_000_000).length },
      { label: '1000만~1억',   count: viewArr.filter(v => v >= 10_000_000 && v < 100_000_000).length },
      { label: '100만~1000만', count: viewArr.filter(v => v >= 1_000_000 && v < 10_000_000).length },
      { label: '10만~100만',   count: viewArr.filter(v => v >= 100_000 && v < 1_000_000).length },
      { label: '10만 미만',    count: viewArr.filter(v => v < 100_000).length },
    ];

    // #2 업로드 요일 분포
    const dayBuckets = DAYS.map((label, idx) => ({
      label,
      count: videos.filter(v => new Date(v.snippet.publishedAt).getDay() === idx).length,
    }));

    const eduViewArr = eduVideos.map(v => toNum(v.statistics.viewCount));
    const eduAvgViews = eduViewArr.length
      ? eduViewArr.reduce((a, b) => a + b, 0) / eduViewArr.length : 0;
    const eduAvgLikeRate = eduViewArr.length
      ? eduViewArr.map((v, i) => v ? toNum(eduVideos[i].statistics.likeCount) / v * 100 : 0)
          .reduce((a, b) => a + b, 0) / eduViewArr.length : 0;

    // #3 TOP 10
    const top10 = [...videos]
      .sort((a, b) => toNum(b.statistics.viewCount) - toNum(a.statistics.viewCount))
      .slice(0, 10);

    return {
      totalViews, avgViews, medianViews, avgLikeRate, avgCommentRate, avgDurSec,
      viewBuckets, dayBuckets, eduAvgViews, eduAvgLikeRate, top10,
    };
  }, [videos, eduVideos]);

  if (loading) return <Skeleton />;
  if (!stats) return <Empty />;

  const maxBucket = Math.max(...stats.viewBuckets.map(b => b.count), 1);
  const maxDay = Math.max(...stats.dayBuckets.map(b => b.count), 1);

  return (
    <div className="p-5 max-w-5xl space-y-5">
      <p className="text-sm text-gray-500">
        분석 기반: <span className="font-semibold text-gray-800">트렌딩 {videos.length}개 영상</span>
        <span className="ml-1.5 text-gray-400 text-xs">({regionCode})</span>
      </p>

      {/* KPI — 중앙값 추가 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiCard label="분석 영상 수" value={`${videos.length}개`} />
        <KpiCard label="총 조회수 합계" value={formatViewCount(String(Math.round(stats.totalViews)))} />
        <KpiCard label="평균 조회수" value={formatViewCount(String(Math.round(stats.avgViews)))} />
        <KpiCard label="중앙값 조회수" value={formatViewCount(String(Math.round(stats.medianViews)))} sub="이상값 영향 제거" />
        <KpiCard label="평균 좋아요율" value={`${stats.avgLikeRate.toFixed(2)}%`} accent />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 조회수 구간 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">조회수 구간 분포</h3>
          <div className="space-y-2.5">
            {stats.viewBuckets.map(b => (
              <BarRow key={b.label} label={b.label} count={b.count} max={maxBucket} total={videos.length} />
            ))}
          </div>
        </div>

        {/* 교육 vs 전체 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">교육 vs 전체 비교</h3>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">구분</th>
                <th className="text-right pb-2 font-medium">영상 수</th>
                <th className="text-right pb-2 font-medium">평균 조회수</th>
                <th className="text-right pb-2 font-medium">좋아요율</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              <tr>
                <td className="py-2.5 text-gray-700">전체 트렌딩</td>
                <td className="py-2.5 text-right font-medium">{videos.length}개</td>
                <td className="py-2.5 text-right font-medium">
                  {formatViewCount(String(Math.round(stats.avgViews)))}
                </td>
                <td className="py-2.5 text-right font-semibold text-red-500">
                  {stats.avgLikeRate.toFixed(2)}%
                </td>
              </tr>
              {eduVideos.length > 0 && (
                <tr>
                  <td className="py-2.5 text-gray-700">📚 교육 TOP30</td>
                  <td className="py-2.5 text-right font-medium">{eduVideos.length}개</td>
                  <td className="py-2.5 text-right font-medium">
                    {formatViewCount(String(Math.round(stats.eduAvgViews)))}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-red-500">
                    {stats.eduAvgLikeRate.toFixed(2)}%
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">평균 영상 길이</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{secToLabel(stats.avgDurSec)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">평균 댓글율</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{stats.avgCommentRate.toFixed(3)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* #2 업로드 요일 분포 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">업로드 요일 분포</h3>
        <p className="text-xs text-gray-400 mb-4">트렌딩 진입 영상의 최초 업로드 요일</p>
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
                    className={`w-full rounded-t-sm transition-all ${isWeekend ? 'bg-blue-400' : 'bg-red-400'}`}
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
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400" />평일
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" />주말
          </span>
        </div>
      </div>

      {/* #3 TOP 10 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">조회수 TOP 10 영상</h3>

        {/* 1~3위: 썸네일 포함 */}
        <div className="space-y-2">
          {stats.top10.slice(0, 3).map((v, i) => {
            const thumb = v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url;
            const rankColor = ['text-yellow-500', 'text-gray-400', 'text-orange-400'][i];
            return (
              <a
                key={v.id}
                href={`https://youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <span className={`text-sm font-bold w-4 flex-shrink-0 ${rankColor}`}>{i + 1}</span>
                <div className="relative w-16 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <Image src={thumb} alt={v.snippet.title} fill className="object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] px-1 rounded font-mono">
                    {formatDuration(v.contentDetails.duration)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-red-600 transition-colors">
                    {v.snippet.title}
                  </p>
                  <p className="text-xs text-gray-400">{v.snippet.channelTitle}</p>
                </div>
                <p className="text-sm font-bold text-gray-700 flex-shrink-0">
                  {formatViewCount(v.statistics.viewCount)}
                </p>
              </a>
            );
          })}
        </div>

        {/* 4~10위: 컴팩트 리스트 */}
        <div className="border-t border-gray-100 mt-3 pt-3 space-y-0.5">
          {stats.top10.slice(3).map((v, i) => (
            <a
              key={v.id}
              href={`https://youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <span className="text-xs font-bold text-gray-300 w-5 flex-shrink-0 text-right">{i + 4}</span>
              <p className="flex-1 text-xs text-gray-700 truncate group-hover:text-red-600 transition-colors">
                {v.snippet.title}
              </p>
              <span className="text-xs text-gray-400 flex-shrink-0 w-20 truncate text-right">
                {v.snippet.channelTitle}
              </span>
              <span className="text-xs font-semibold text-gray-600 flex-shrink-0 w-16 text-right">
                {formatViewCount(v.statistics.viewCount)}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
