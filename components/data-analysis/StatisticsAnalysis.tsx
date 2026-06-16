'use client';

import { useMemo } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import { formatViewCount } from '@/lib/formatters';

function toNum(s?: string) { return parseInt(s || '0') || 0; }

function toKST(iso: string): { day: number; hour: number } {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return { day: d.getUTCDay(), hour: d.getUTCHours() };
}

// Mon-first display
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function heatBg(count: number, max: number): string {
  if (count === 0 || max === 0) return '#f3f4f6';
  const alpha = 0.15 + (count / max) * 0.85;
  return `rgba(239,68,68,${alpha.toFixed(2)})`;
}

function KpiCard({ label, value, sub, variant = 'white' }: {
  label: string; value: string; sub?: string;
  variant?: 'white' | 'red' | 'amber';
}) {
  const cls = {
    white: { wrap: 'bg-white border-gray-100',      text: 'text-gray-900' },
    red:   { wrap: 'bg-red-50 border-red-200',      text: 'text-red-600'  },
    amber: { wrap: 'bg-amber-50 border-amber-200',  text: 'text-amber-600' },
  }[variant];
  return (
    <div className={`rounded-2xl p-4 border shadow-sm ${cls.wrap}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold leading-tight ${cls.text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-5 max-w-5xl space-y-5 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-60 bg-gray-100 rounded-2xl" />
        <div className="h-60 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-52 bg-gray-100 rounded-2xl" />
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

interface Props { videos: YouTubeVideo[]; loading: boolean; }

export default function StatisticsAnalysis({ videos, loading }: Props) {
  const stats = useMemo(() => {
    if (!videos.length) return null;

    const dayCount = new Array<number>(7).fill(0);
    const dayViews = new Array<number>(7).fill(0);
    const dayLikes = new Array<number>(7).fill(0);
    const heatRaw: number[][] = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));

    for (const v of videos) {
      const { day, hour } = toKST(v.snippet.publishedAt);
      dayCount[day]++;
      dayViews[day] += toNum(v.statistics.viewCount);
      dayLikes[day] += toNum(v.statistics.likeCount);
      heatRaw[day][hour]++;
    }

    const dayStats = DAY_ORDER.map((jsDay, di) => ({
      label: DAY_LABELS[di],
      count: dayCount[jsDay],
      avgViews: dayCount[jsDay] ? Math.round(dayViews[jsDay] / dayCount[jsDay]) : 0,
      avgLikeRate: dayViews[jsDay] ? dayLikes[jsDay] / dayViews[jsDay] * 100 : 0,
    }));

    const heatGrid = DAY_ORDER.map(d => heatRaw[d]);

    // Title length
    const titleLens = videos.map(v => [...v.snippet.title].length);
    const avgTitleLen = Math.round(titleLens.reduce((a, b) => a + b, 0) / videos.length);
    const minTitleLen = Math.min(...titleLens);
    const maxTitleLen = Math.max(...titleLens);

    const sortedByViews = [...videos].sort((a, b) => toNum(b.statistics.viewCount) - toNum(a.statistics.viewCount));
    const top25n = Math.max(1, Math.ceil(videos.length * 0.25));
    const optimalLen = Math.round(
      sortedByViews.slice(0, top25n).reduce((a, v) => a + [...v.snippet.title].length, 0) / top25n
    );

    const emojiRe = /\p{Extended_Pictographic}/u;
    const emojiPct   = videos.filter(v => emojiRe.test(v.snippet.title)).length / videos.length * 100;
    const numberPct  = videos.filter(v => /\d/.test(v.snippet.title)).length / videos.length * 100;
    const bracketPct = videos.filter(v => /[\[\]【】「」『』〔〕()]/.test(v.snippet.title)).length / videos.length * 100;

    const bDefs = [
      { label: '~15자',   min: 0,  maxV: 15 },
      { label: '16-25자', min: 16, maxV: 25 },
      { label: '26-35자', min: 26, maxV: 35 },
      { label: '36-45자', min: 36, maxV: 45 },
      { label: '46-55자', min: 46, maxV: 55 },
      { label: '56-65자', min: 56, maxV: 65 },
      { label: '66-75자', min: 66, maxV: 75 },
      { label: '76자+',   min: 76, maxV: Infinity },
    ];

    const buckets = bDefs.map(b => {
      const vs = videos.filter((_, i) => titleLens[i] >= b.min && titleLens[i] <= b.maxV);
      const avgViews = vs.length
        ? Math.round(vs.reduce((a, v) => a + toNum(v.statistics.viewCount), 0) / vs.length)
        : 0;
      return { label: b.label, count: vs.length, avgViews };
    });

    return { dayStats, heatGrid, avgTitleLen, minTitleLen, maxTitleLen, optimalLen, emojiPct, numberPct, bracketPct, buckets };
  }, [videos]);

  if (loading) return <Skeleton />;
  if (!stats) return <Empty />;

  const maxDayCount   = Math.max(...stats.dayStats.map(d => d.count), 1);
  const maxDayAvgV    = Math.max(...stats.dayStats.map(d => d.avgViews), 1);
  const maxBucketCnt  = Math.max(...stats.buckets.map(b => b.count), 1);
  const maxBucketAvgV = Math.max(...stats.buckets.map(b => b.avgViews), 1);
  const heatMax       = Math.max(...stats.heatGrid.flat(), 1);
  const bestDayCount  = Math.max(...stats.dayStats.map(d => d.count));

  // SVG chart dimensions
  const VW = 280, VH = 140, PT = 14, PB = 22, PL = 6, PR = 6;
  const PW = VW - PL - PR;
  const PH = VH - PT - PB;
  const colW = PW / 7;
  const barW = colW * 0.5;

  // Build line path — breaks on days with no uploads
  const linePath = stats.dayStats.reduce<{ path: string; drawing: boolean }>(
    (acc, d, i) => {
      if (d.count === 0) return { path: acc.path, drawing: false };
      const cx = PL + colW * i + colW / 2;
      const y  = PT + (1 - d.avgViews / maxDayAvgV) * PH;
      const cmd = acc.drawing ? `L${cx.toFixed(1)},${y.toFixed(1)}` : `M${cx.toFixed(1)},${y.toFixed(1)}`;
      return { path: acc.path + cmd, drawing: true };
    },
    { path: '', drawing: false }
  ).path;

  return (
    <div className="p-5 max-w-5xl space-y-5">
      <p className="text-sm text-gray-500">
        분석 기반: <span className="font-semibold text-gray-800">트렌딩 {videos.length}개 영상</span>
        <span className="ml-1.5 text-gray-400 text-xs">(업로드 시각 KST 기준)</span>
      </p>

      {/* ① 제목 길이 KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label="평균 제목 길이"
          value={`${stats.avgTitleLen}자`}
          sub={`범위 ${stats.minTitleLen}자 ~ ${stats.maxTitleLen}자`}
          variant="red"
        />
        <KpiCard
          label="최적 제목 길이"
          value={`${stats.optimalLen}자`}
          sub="조회수 상위 25% 영상 평균"
          variant="amber"
        />
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 mb-2.5">특수 요소 포함률</p>
          <div className="space-y-2">
            {[
              { label: '이모지',   pct: stats.emojiPct,   bar: 'bg-purple-400' },
              { label: '숫자',     pct: stats.numberPct,  bar: 'bg-blue-400'   },
              { label: '[ ] 괄호', pct: stats.bracketPct, bar: 'bg-teal-400'   },
            ].map(({ label, pct, bar }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-14 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`${bar} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ② 제목 히스토그램 + ③ 요일별 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* 제목 길이 히스토그램 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">제목 길이 분포</h3>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" />
              조회수 최고 구간
            </span>
          </div>
          <div className="flex items-end h-32 gap-1">
            {stats.buckets.map(b => {
              const isTop = b.avgViews === maxBucketAvgV && b.count > 0;
              const hPct = b.count ? Math.max(6, (b.count / maxBucketCnt) * 100) : 0;
              return (
                <div key={b.label} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                  {b.count > 0 && (
                    <span className="text-[10px] leading-none text-gray-500">{b.count}</span>
                  )}
                  <div
                    className={`w-full rounded-t-sm ${isTop ? 'bg-amber-400' : 'bg-red-300'}`}
                    style={{ height: `${hPct}%` }}
                    title={b.count > 0 ? `${b.label}: ${b.count}개 · 평균 ${formatViewCount(String(b.avgViews))}` : b.label}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-gray-50">
            {stats.buckets.map(b => (
              <div key={b.label} className="flex-1 text-center text-[8px] text-gray-400 leading-tight">
                {b.label.replace('자', '').replace('+', '+')}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1">단위: 글자 수(자)</p>
        </div>

        {/* 요일별 업로드 × 조회수 복합 차트 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">요일별 업로드 & 조회수</h3>
            <div className="flex gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-0.5">
                <span className="inline-block w-3 h-2.5 rounded-sm bg-red-300 mr-0.5" />업로드 수
              </span>
              <span className="flex items-center gap-0.5">
                <span className="inline-block w-3 border-t-2 border-blue-400 mr-0.5" />평균 조회수
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="auto">
            {[0, 0.5, 1].map(t => (
              <line key={t}
                x1={PL} y1={PT + (1 - t) * PH}
                x2={VW - PR} y2={PT + (1 - t) * PH}
                stroke="#f3f4f6" strokeWidth={0.8} />
            ))}

            {stats.dayStats.map((d, i) => {
              const cx = PL + colW * i + colW / 2;
              const bh = d.count ? (d.count / maxDayCount) * PH : 0;
              const by = PT + PH - bh;
              const isBest = d.count === bestDayCount && d.count > 0;
              return (
                <g key={d.label}>
                  {bh > 0 && (
                    <rect
                      x={cx - barW / 2} y={by}
                      width={barW} height={bh}
                      rx={2.5}
                      fill={isBest ? '#f87171' : '#fca5a5'}
                    >
                      <title>{`${d.label}요일: ${d.count}개 업로드`}</title>
                    </rect>
                  )}
                  {d.count > 0 && (
                    <text x={cx} y={by - 2} textAnchor="middle" fontSize={7} fill="#9ca3af">
                      {d.count}
                    </text>
                  )}
                </g>
              );
            })}

            {linePath && (
              <path d={linePath} fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeLinejoin="round" />
            )}
            {stats.dayStats.map((d, i) => {
              if (d.count === 0) return null;
              const cx = PL + colW * i + colW / 2;
              const y  = PT + (1 - d.avgViews / maxDayAvgV) * PH;
              return (
                <circle key={i} cx={cx} cy={y} r={2.5} fill="white" stroke="#60a5fa" strokeWidth={1.5}>
                  <title>{`${d.label}요일 평균 조회수: ${formatViewCount(String(d.avgViews))}`}</title>
                </circle>
              );
            })}

            {stats.dayStats.map((d, i) => (
              <text key={i} x={PL + colW * i + colW / 2} y={VH - 5}
                textAnchor="middle" fontSize={9} fill="#9ca3af">
                {d.label}
              </text>
            ))}
          </svg>

          {/* 좋아요율 행 */}
          <div className="grid grid-cols-7 border-t border-gray-50 pt-2 mt-0.5">
            {stats.dayStats.map(d => (
              <div key={d.label} className="text-center">
                <p className="text-[9px] font-medium text-blue-400">
                  {d.count > 0 ? `${d.avgLikeRate.toFixed(1)}%` : '-'}
                </p>
                <p className="text-[8px] text-gray-300">좋아요율</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ④ 시간대 히트맵 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">업로드 시간대 히트맵</h3>
          <span className="text-[10px] text-gray-400">KST 기준 · 셀에 마우스를 올려 상세 확인</span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div style={{ minWidth: 560 }}>
            {/* 시간 헤더 */}
            <div className="flex mb-1" style={{ paddingLeft: 28 }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 text-center" style={{ fontSize: 9, color: '#9ca3af', lineHeight: 1 }}>
                  {h % 6 === 0 ? `${h}시` : ''}
                </div>
              ))}
            </div>
            {/* 요일 행 */}
            {stats.heatGrid.map((row, ri) => (
              <div key={ri} className="flex items-center gap-0.5 mb-0.5">
                <span className="flex-shrink-0 text-xs text-gray-500 text-right pr-1.5" style={{ width: 24 }}>
                  {DAY_LABELS[ri]}
                </span>
                {row.map((cnt, h) => (
                  <div
                    key={h}
                    className="flex-1 rounded-sm cursor-default"
                    style={{ height: 22, backgroundColor: heatBg(cnt, heatMax) }}
                    title={`${DAY_LABELS[ri]}요일 ${h}시 (KST): ${cnt}개`}
                  />
                ))}
              </div>
            ))}
            {/* 범례 */}
            <div className="flex items-center gap-1.5 justify-end mt-3">
              <span className="text-[10px] text-gray-400">적음</span>
              {[0, 0.33, 0.66, 1].map(t => (
                <div key={t} className="rounded-sm" style={{
                  width: 16, height: 16,
                  backgroundColor: t === 0 ? '#f3f4f6' : `rgba(239,68,68,${(0.15 + t * 0.85).toFixed(2)})`,
                }} />
              ))}
              <span className="text-[10px] text-gray-400">많음</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
