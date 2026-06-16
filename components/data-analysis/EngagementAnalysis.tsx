'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import type { YouTubeVideo } from '@/types/youtube';
import { formatViewCount } from '@/lib/formatters';

function toNum(s?: string) { return parseInt(s || '0') || 0; }

function parseSec(dur: string): number {
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] || '0') * 3600 + parseInt(m[2] || '0') * 60 + parseInt(m[3] || '0');
}

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

interface BarRowProps { label: string; value: number; max: number; count?: number; total?: number; color?: string; unit?: string }
function BarRow({ label, value, max, count, total, color = 'bg-red-400', unit = '%' }: BarRowProps) {
  const pct = max ? Math.max(value > 0 ? 4 : 0, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-gray-600 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      {count !== undefined && (
        <span className="text-xs font-medium text-gray-700 w-5 text-right">{count}</span>
      )}
      {total !== undefined && count !== undefined && (
        <span className="text-xs text-gray-400 w-9 text-right">
          {total ? `${Math.round(count / total * 100)}%` : ''}
        </span>
      )}
      {count === undefined && (
        <span className="text-xs font-semibold text-gray-700 w-14 text-right">
          {value.toFixed(2)}{unit}
        </span>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-5 max-w-5xl space-y-5 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <p className="text-sm">트렌드 탭에서 데이터를 먼저 불러와주세요.</p>
    </div>
  );
}

interface VideoEngRow { v: YouTubeVideo; likeRate: number; commentRate: number }

function EngTable({ rows, label, color }: { rows: VideoEngRow[]; label: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{label}</h3>
      <div className="space-y-1">
        <div className="flex items-center gap-3 px-2 pb-2 border-b border-gray-100">
          <span className="text-xs text-gray-400 w-4">#</span>
          <span className="text-xs text-gray-400 flex-1">영상</span>
          <span className="text-xs text-gray-400 w-20 text-right">조회수</span>
          <span className="text-xs text-gray-400 w-16 text-right">좋아요율</span>
          <span className="text-xs text-gray-400 w-16 text-right">댓글율</span>
        </div>
        {rows.map(({ v, likeRate, commentRate }, i) => {
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
              <span className={`text-xs font-semibold w-16 text-right ${color}`}>
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
  );
}

interface Props { videos: YouTubeVideo[]; loading: boolean }

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

    const commentBuckets = [
      { label: '1% 이상',    count: commentRates.filter(r => r >= 1).length },
      { label: '0.5~1%',    count: commentRates.filter(r => r >= 0.5 && r < 1).length },
      { label: '0.1~0.5%',  count: commentRates.filter(r => r >= 0.1 && r < 0.5).length },
      { label: '0.05~0.1%', count: commentRates.filter(r => r >= 0.05 && r < 0.1).length },
      { label: '0.05% 미만', count: commentRates.filter(r => r < 0.05).length },
    ];

    // #6 TOP 10 / 하위 5
    const ranked = [...videos]
      .map((v, i) => ({ v, likeRate: likeRates[i], commentRate: commentRates[i] }))
      .sort((a, b) => b.likeRate - a.likeRate);
    const top10 = ranked.slice(0, 10);
    const bottom5 = [...ranked].reverse().slice(0, 5);

    // #7 영상 길이별 참여도
    const durGroups = [
      { label: '쇼츠 (<1분)', rates: [] as number[] },
      { label: '단편 (1~5분)', rates: [] as number[] },
      { label: '중편 (5~10분)', rates: [] as number[] },
      { label: '장편 (10~20분)', rates: [] as number[] },
      { label: '초장편 (20분+)', rates: [] as number[] },
    ];
    videos.forEach((v, i) => {
      const s = parseSec(v.contentDetails.duration);
      if (s < 60) durGroups[0].rates.push(likeRates[i]);
      else if (s < 300) durGroups[1].rates.push(likeRates[i]);
      else if (s < 600) durGroups[2].rates.push(likeRates[i]);
      else if (s < 1200) durGroups[3].rates.push(likeRates[i]);
      else durGroups[4].rates.push(likeRates[i]);
    });
    const durEngagement = durGroups
      .filter(g => g.rates.length > 0)
      .map(g => ({
        label: g.label,
        avgLikeRate: g.rates.reduce((a, b) => a + b, 0) / g.rates.length,
        count: g.rates.length,
      }));

    // #9 조회수 구간별 참여도
    const viewRangeGroups = [
      { label: '1억 이상',     rates: [] as number[] },
      { label: '1000만~1억',   rates: [] as number[] },
      { label: '100만~1000만', rates: [] as number[] },
      { label: '10만~100만',   rates: [] as number[] },
      { label: '10만 미만',    rates: [] as number[] },
    ];
    videos.forEach((v, i) => {
      const views = toNum(v.statistics.viewCount);
      if (views >= 100_000_000) viewRangeGroups[0].rates.push(likeRates[i]);
      else if (views >= 10_000_000) viewRangeGroups[1].rates.push(likeRates[i]);
      else if (views >= 1_000_000) viewRangeGroups[2].rates.push(likeRates[i]);
      else if (views >= 100_000) viewRangeGroups[3].rates.push(likeRates[i]);
      else viewRangeGroups[4].rates.push(likeRates[i]);
    });
    const viewRangeEngagement = viewRangeGroups
      .filter(g => g.rates.length > 0)
      .map(g => ({
        label: g.label,
        count: g.rates.length,
        avgLikeRate: g.rates.reduce((a, b) => a + b, 0) / g.rates.length,
      }));

    // #10 채널별 평균 참여도 (2개 이상 영상 있는 채널만)
    const chMap: Record<string, { title: string; likeRates: number[] }> = {};
    videos.forEach((v, i) => {
      const id = v.snippet.channelId;
      if (!chMap[id]) chMap[id] = { title: v.snippet.channelTitle, likeRates: [] };
      chMap[id].likeRates.push(likeRates[i]);
    });
    const channelEngagement = Object.values(chMap)
      .filter(c => c.likeRates.length >= 2)
      .map(c => ({
        title: c.title,
        count: c.likeRates.length,
        avgLikeRate: c.likeRates.reduce((a, b) => a + b, 0) / c.likeRates.length,
      }))
      .sort((a, b) => b.avgLikeRate - a.avgLikeRate)
      .slice(0, 5);

    return {
      avgLikeRate, avgCommentRate, likeCommentRatio,
      withLikesCount: withLikes.length, withCommentsCount: withComments.length,
      likeBuckets, commentBuckets,
      top10, bottom5, durEngagement, viewRangeEngagement, channelEngagement,
    };
  }, [videos]);

  if (loading) return <Skeleton />;
  if (!stats) return <Empty />;

  const maxLikeBucket = Math.max(...stats.likeBuckets.map(b => b.count), 1);
  const maxCommentBucket = Math.max(...stats.commentBuckets.map(b => b.count), 1);
  const maxDurRate = Math.max(...stats.durEngagement.map(d => d.avgLikeRate), 0.01);
  const maxViewRate = Math.max(...stats.viewRangeEngagement.map(d => d.avgLikeRate), 0.01);

  return (
    <div className="p-5 max-w-5xl space-y-5">
      <p className="text-sm text-gray-500">
        분석 기반: <span className="font-semibold text-gray-800">트렌딩 {videos.length}개 영상</span>
        <span className="ml-1.5 text-gray-400 text-xs">
          (좋아요 공개 {stats.withLikesCount}개 · 댓글 공개 {stats.withCommentsCount}개)
        </span>
      </p>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="평균 좋아요율" value={`${stats.avgLikeRate.toFixed(2)}%`} accent />
        <KpiCard label="평균 댓글율" value={`${stats.avgCommentRate.toFixed(3)}%`} />
        <KpiCard label="좋아요 / 댓글 비율" value={`${stats.likeCommentRatio.toFixed(1)}x`} sub="댓글 1개당 좋아요 수" />
      </div>

      {/* 구간 분포 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">좋아요율 구간 분포</h3>
          <div className="space-y-2.5">
            {stats.likeBuckets.map(b => (
              <BarRow key={b.label} label={b.label} value={b.count} max={maxLikeBucket}
                count={b.count} total={videos.length} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">댓글율 구간 분포</h3>
          <div className="space-y-2.5">
            {stats.commentBuckets.map(b => (
              <BarRow key={b.label} label={b.label} value={b.count} max={maxCommentBucket}
                count={b.count} total={videos.length} color="bg-blue-400" />
            ))}
          </div>
        </div>
      </div>

      {/* #7 영상 길이별 참여도 / #9 조회수 구간별 참여도 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stats.durEngagement.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">영상 길이별 평균 좋아요율</h3>
            <p className="text-xs text-gray-400 mb-3">짧은 영상과 긴 영상 중 어느 쪽이 더 반응이 좋은가</p>
            <div className="space-y-2.5">
              {stats.durEngagement.map(d => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-28 flex-shrink-0">{d.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-400 h-2 rounded-full"
                      style={{ width: `${Math.max(4, (d.avgLikeRate / maxDurRate) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-purple-600 w-14 text-right">
                    {d.avgLikeRate.toFixed(2)}%
                  </span>
                  <span className="text-xs text-gray-400 w-8 text-right">({d.count}개)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.viewRangeEngagement.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">조회수 구간별 평균 좋아요율</h3>
            <p className="text-xs text-gray-400 mb-3">조회수가 높을수록 좋아요율이 낮아지는 역상관 패턴</p>
            <div className="space-y-2.5">
              {stats.viewRangeEngagement.map(d => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-28 flex-shrink-0">{d.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-teal-400 h-2 rounded-full"
                      style={{ width: `${Math.max(4, (d.avgLikeRate / maxViewRate) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-teal-600 w-14 text-right">
                    {d.avgLikeRate.toFixed(2)}%
                  </span>
                  <span className="text-xs text-gray-400 w-8 text-right">({d.count}개)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* #10 채널별 참여도 (2개 이상 영상 있는 채널만) */}
      {stats.channelEngagement.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">채널별 평균 참여도</h3>
          <p className="text-xs text-gray-400 mb-3">트렌딩 영상이 2개 이상인 채널만 표시</p>
          <div className="space-y-2">
            {stats.channelEngagement.map((c, i) => (
              <div key={c.title} className="flex items-center gap-3 px-2 py-1.5">
                <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                <span className="flex-1 text-xs font-medium text-gray-800 truncate">{c.title}</span>
                <span className="text-xs text-gray-400">영상 {c.count}개</span>
                <span className="text-xs font-semibold text-red-500 w-16 text-right">
                  {c.avgLikeRate.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* #6 TOP 10 */}
      <EngTable rows={stats.top10} label="참여도 TOP 10 영상 (좋아요율 기준)" color="text-red-500" />

      {/* #8 하위 5개 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">참여도 하위 5개 영상</h3>
        <p className="text-xs text-gray-400 mb-3">좋아요율이 낮은 영상 — 조회수 대비 반응이 적은 콘텐츠 패턴 파악</p>
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-2 pb-2 border-b border-gray-100">
            <span className="text-xs text-gray-400 w-4">#</span>
            <span className="text-xs text-gray-400 flex-1">영상</span>
            <span className="text-xs text-gray-400 w-20 text-right">조회수</span>
            <span className="text-xs text-gray-400 w-16 text-right">좋아요율</span>
            <span className="text-xs text-gray-400 w-16 text-right">댓글율</span>
          </div>
          {stats.bottom5.map(({ v, likeRate, commentRate }, i) => {
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
                <span className="text-xs font-semibold text-gray-400 w-16 text-right">
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
