'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import type { YouTubeVideo } from '@/types/youtube';
import { formatViewCount } from '@/lib/formatters';

// ── helpers ───────────────────────────────────────────────────────────────────

function toNum(s?: string) {
  return parseInt(s || '0') || 0;
}

// ── sub-components ────────────────────────────────────────────────────────────

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
  const pct = max ? Math.max(count > 0 ? 4 : 0, (count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-gray-600 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-5 text-right">{count}</span>
      <span className="text-xs text-gray-400 w-9 text-right">
        {total ? `${Math.round(count / total * 100)}%` : ''}
      </span>
    </div>
  );
}

// ── skeleton / empty ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="p-5 max-w-5xl space-y-5 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-48 bg-gray-100 rounded-2xl" />
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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

export default function EngagementAnalysis({ videos, loading }: Props) {
  const stats = useMemo(() => {
    if (!videos.length) return null;

    const withLikes = videos.filter(v => v.statistics.likeCount);
    const withComments = videos.filter(v => v.statistics.commentCount);

    const likeRates = videos.map(v => {
      const views = toNum(v.statistics.viewCount);
      return views ? toNum(v.statistics.likeCount) / views * 100 : 0;
    });
    const commentRates = videos.map(v => {
      const views = toNum(v.statistics.viewCount);
      return views ? toNum(v.statistics.commentCount) / views * 100 : 0;
    });

    const avgLikeRate = likeRates.reduce((a, b) => a + b, 0) / videos.length;
    const avgCommentRate = commentRates.reduce((a, b) => a + b, 0) / videos.length;
    const likeCommentRatio = avgCommentRate > 0 ? avgLikeRate / avgCommentRate : 0;

    // 좋아요율 구간
    const likeBuckets = [
      { label: '10% 이상',  count: likeRates.filter(r => r >= 10).length },
      { label: '5~10%',     count: likeRates.filter(r => r >= 5 && r < 10).length },
      { label: '3~5%',      count: likeRates.filter(r => r >= 3 && r < 5).length },
      { label: '1~3%',      count: likeRates.filter(r => r >= 1 && r < 3).length },
      { label: '1% 미만',   count: likeRates.filter(r => r < 1).length },
    ];

    // 댓글율 구간
    const commentBuckets = [
      { label: '1% 이상',    count: commentRates.filter(r => r >= 1).length },
      { label: '0.5~1%',    count: commentRates.filter(r => r >= 0.5 && r < 1).length },
      { label: '0.1~0.5%',  count: commentRates.filter(r => r >= 0.1 && r < 0.5).length },
      { label: '0.05~0.1%', count: commentRates.filter(r => r >= 0.05 && r < 0.1).length },
      { label: '0.05% 미만', count: commentRates.filter(r => r < 0.05).length },
    ];

    // 참여도 TOP 5 (좋아요율 기준)
    const top5 = [...videos]
      .map((v, i) => ({ v, likeRate: likeRates[i], commentRate: commentRates[i] }))
      .sort((a, b) => b.likeRate - a.likeRate)
      .slice(0, 5);

    return {
      avgLikeRate, avgCommentRate, likeCommentRatio,
      withLikesCount: withLikes.length, withCommentsCount: withComments.length,
      likeBuckets, commentBuckets, top5,
    };
  }, [videos]);

  if (loading) return <Skeleton />;
  if (!stats) return <Empty />;

  const maxLikeBucket = Math.max(...stats.likeBuckets.map(b => b.count), 1);
  const maxCommentBucket = Math.max(...stats.commentBuckets.map(b => b.count), 1);

  return (
    <div className="p-5 max-w-5xl space-y-5">
      <p className="text-sm text-gray-500">
        분석 기반: <span className="font-semibold text-gray-800">트렌딩 {videos.length}개 영상</span>
        <span className="ml-1.5 text-gray-400 text-xs">
          (좋아요 공개 {stats.withLikesCount}개 · 댓글 공개 {stats.withCommentsCount}개)
        </span>
      </p>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="평균 좋아요율" value={`${stats.avgLikeRate.toFixed(2)}%`} accent />
        <KpiCard label="평균 댓글율" value={`${stats.avgCommentRate.toFixed(3)}%`} />
        <KpiCard
          label="좋아요 / 댓글 비율"
          value={`${stats.likeCommentRatio.toFixed(1)}x`}
          sub="댓글 1개당 좋아요 수"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 좋아요율 구간 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">좋아요율 구간 분포</h3>
          <div className="space-y-2.5">
            {stats.likeBuckets.map(b => (
              <BarRow key={b.label} label={b.label} count={b.count} max={maxLikeBucket} total={videos.length} />
            ))}
          </div>
        </div>

        {/* 댓글율 구간 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">댓글율 구간 분포</h3>
          <div className="space-y-2.5">
            {stats.commentBuckets.map(b => (
              <BarRow key={b.label} label={b.label} count={b.count} max={maxCommentBucket}
                total={videos.length} color="bg-blue-400" />
            ))}
          </div>
        </div>
      </div>

      {/* 참여도 TOP 5 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">참여도 TOP 5 영상 (좋아요율 기준)</h3>
        <div className="space-y-1">
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-2 pb-2 border-b border-gray-100">
            <span className="text-xs text-gray-400 w-4 flex-shrink-0">#</span>
            <span className="text-xs text-gray-400 flex-1">영상</span>
            <span className="text-xs text-gray-400 w-20 text-right">조회수</span>
            <span className="text-xs text-gray-400 w-16 text-right">좋아요율</span>
            <span className="text-xs text-gray-400 w-16 text-right">댓글율</span>
          </div>
          {stats.top5.map(({ v, likeRate, commentRate }, i) => {
            const thumb = v.snippet.thumbnails.default?.url;
            return (
              <a
                key={v.id}
                href={`https://youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                <div className="relative w-12 h-7 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                  {thumb && <Image src={thumb} alt={v.snippet.title} fill className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate group-hover:text-red-600 transition-colors">
                    {v.snippet.title}
                  </p>
                  <p className="text-[11px] text-gray-400">{v.snippet.channelTitle}</p>
                </div>
                <span className="text-xs text-gray-700 w-20 text-right">
                  {formatViewCount(v.statistics.viewCount)}
                </span>
                <span className="text-xs font-semibold text-red-500 w-16 text-right">
                  {likeRate.toFixed(2)}%
                </span>
                <span className="text-xs text-blue-500 w-16 text-right">
                  {commentRate.toFixed(3)}%
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
