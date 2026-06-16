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

function secToLabel(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}분 ${sec}초`;
}

const DAY_JS = [1, 2, 3, 4, 5, 6, 0];
const DAY_KO = ['월', '화', '수', '목', '금', '토', '일'];

const QUICK_LINKS = [
  { label: '트렌드 스냅샷', icon: '📊', tab: 'data-analysis', side: 'snapshot'       },
  { label: '참여도 분석',   icon: '📈', tab: 'data-analysis', side: 'engagement'     },
  { label: '콘텐츠 패턴',  icon: '🎯', tab: 'data-analysis', side: 'content-pattern' },
  { label: '통계 분석',    icon: '📉', tab: 'data-analysis', side: 'statistics'      },
  { label: 'AI 트렌드 요약', icon: '🤖', tab: 'ai',           side: 'ai-summary'    },
  { label: 'AI 콘텐츠 전략',icon: '🎯', tab: 'ai',           side: 'ai-strategy'    },
];

interface Props {
  videos: YouTubeVideo[];
  regionCode: string;
  onNavigate: (tab: string, side: string) => void;
}

export default function DashboardPage({ videos, regionCode, onNavigate }: Props) {
  const stats = useMemo(() => {
    if (!videos.length) return null;

    const views  = videos.map(v => toNum(v.statistics.viewCount));
    const likes  = videos.map(v => toNum(v.statistics.likeCount));
    const cmts   = videos.map(v => toNum(v.statistics.commentCount));
    const durs   = videos.map(v => parseSec(v.contentDetails.duration));

    const totalViews    = views.reduce((a, b) => a + b, 0);
    const avgViews      = totalViews / videos.length;
    const avgLikeRate   = views.map((v, i) => v ? likes[i] / v * 100 : 0).reduce((a, b) => a + b, 0) / videos.length;
    const avgCommentRate= views.map((v, i) => v ? cmts[i]  / v * 100 : 0).reduce((a, b) => a + b, 0) / videos.length;
    const avgDur        = durs.reduce((a, b) => a + b, 0) / videos.length;

    const top5 = [...videos]
      .sort((a, b) => toNum(b.statistics.viewCount) - toNum(a.statistics.viewCount))
      .slice(0, 5);

    const dayCount = new Array<number>(7).fill(0);
    for (const v of videos) {
      const kst = new Date(new Date(v.snippet.publishedAt).getTime() + 9 * 3600 * 1000);
      dayCount[kst.getUTCDay()]++;
    }

    const stopWords = new Set(['the','a','an','in','of','for','to','and','is','are','on','at','by',
      '이','그','저','것','수','있','없','하다','이다','되다','않다','에서','에게','부터','까지','했','했다']);
    const wordCount: Record<string, number> = {};
    for (const v of videos) {
      for (const w of v.snippet.title.split(/[\s\[\]【】《》\(\)!?.,·|_\-"'~#@]+/)) {
        if (w.length < 2 || stopWords.has(w.toLowerCase()) || /^\d+$/.test(w)) continue;
        const k = w.toLowerCase();
        wordCount[k] = (wordCount[k] || 0) + 1;
      }
    }
    const keywords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));

    return { totalViews, avgViews, avgLikeRate, avgCommentRate, avgDur, top5, dayCount, keywords };
  }, [videos]);

  if (!videos.length || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <p className="text-sm">트렌드 탭에서 데이터를 먼저 불러와주세요.</p>
      </div>
    );
  }

  const maxDay = Math.max(...stats.dayCount, 1);

  return (
    <div className="p-5 max-w-5xl space-y-5">
      <p className="text-sm text-gray-500">
        트렌딩 <span className="font-semibold text-gray-800">{videos.length}개 영상</span> 기반
        <span className="ml-1.5 text-gray-400 text-xs">({regionCode})</span>
      </p>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">총 조회수</p>
          <p className="text-xl font-bold text-red-600 leading-tight">
            {formatViewCount(String(Math.round(stats.totalViews)))}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">평균 조회수</p>
          <p className="text-xl font-bold text-gray-900 leading-tight">
            {formatViewCount(String(Math.round(stats.avgViews)))}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">평균 좋아요율</p>
          <p className="text-xl font-bold text-gray-900 leading-tight">{stats.avgLikeRate.toFixed(2)}%</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">평균 영상 길이</p>
          <p className="text-xl font-bold text-gray-900 leading-tight">{secToLabel(stats.avgDur)}</p>
          <p className="text-xs text-gray-400 mt-0.5">댓글율 {stats.avgCommentRate.toFixed(3)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* TOP 5 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">조회수 TOP 5</h3>
          <div className="space-y-1.5">
            {stats.top5.map((v, i) => {
              const thumb = v.snippet.thumbnails.default?.url;
              const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400'];
              return (
                <a key={v.id}
                  href={`https://youtube.com/watch?v=${v.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <span className={`text-sm font-bold w-4 flex-shrink-0 ${rankColors[i] ?? 'text-gray-300'}`}>{i + 1}</span>
                  {thumb && (
                    <div className="relative w-14 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image src={thumb} alt={v.snippet.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-red-600 transition-colors">
                      {v.snippet.title}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{v.snippet.channelTitle}</p>
                  </div>
                  <p className="text-xs font-bold text-gray-600 flex-shrink-0">
                    {formatViewCount(v.statistics.viewCount)}
                  </p>
                </a>
              );
            })}
          </div>
        </div>

        {/* 요일 미니 차트 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">요일별 업로드 분포</h3>
          <div className="flex items-end gap-1 h-20">
            {DAY_JS.map((jsDay, di) => {
              const cnt = stats.dayCount[jsDay];
              const hPct = cnt ? Math.max(8, (cnt / maxDay) * 100) : 0;
              const isBest = cnt === maxDay && cnt > 0;
              return (
                <div key={di} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                  {cnt > 0 && <span className="text-[10px] text-gray-500 leading-none">{cnt}</span>}
                  <div
                    className={`w-full rounded-t-sm ${isBest ? 'bg-red-500' : 'bg-red-200'}`}
                    style={{ height: `${hPct}%` }}
                    title={`${DAY_KO[di]}요일: ${cnt}개`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1.5">
            {DAY_JS.map((_, di) => (
              <div key={di} className="flex-1 text-center text-[9px] text-gray-400">{DAY_KO[di]}</div>
            ))}
          </div>
        </div>
      </div>

      {/* 인기 키워드 */}
      {stats.keywords.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">인기 키워드 TOP {stats.keywords.length}</h3>
          <div className="flex flex-wrap gap-2">
            {stats.keywords.map((k, i) => {
              const intensity = k.count / stats.keywords[0].count;
              const size = intensity > 0.7 ? 'text-base' : intensity > 0.4 ? 'text-sm' : 'text-xs';
              const bg = i < 3 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200';
              return (
                <span key={k.word}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-medium ${size} ${bg}`}>
                  {k.word}
                  <span className="text-[10px] opacity-60">{k.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 빠른 이동 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">빠른 이동</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {QUICK_LINKS.map(({ label, icon, tab, side }) => (
            <button key={label}
              onClick={() => onNavigate(tab, side)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors text-sm text-gray-700 font-medium text-left">
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
