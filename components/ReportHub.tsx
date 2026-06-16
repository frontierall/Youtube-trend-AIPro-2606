'use client';

import { useState } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import {
  printDataAnalysisReport,
  exportVideosToCSV,
  exportSnapshotToCSV,
  exportEngagementToCSV,
  exportChannelPatternToCSV,
  exportKeywordsToCSV,
} from '@/lib/reports';

interface Props {
  videos: YouTubeVideo[];
  eduVideos: YouTubeVideo[];
  regionCode: string;
}

const EXPORTS = [
  {
    key: 'pdf',
    icon: '🖨️',
    label: '통합 리포트 PDF 인쇄',
    desc: '트렌드 스냅샷, 참여도, 채널 패턴, 키워드를 하나의 인쇄 보고서로 출력합니다.',
    color: 'border-red-200 hover:border-red-400 hover:bg-red-50',
    badge: 'bg-red-100 text-red-700',
    badgeLabel: 'PDF',
  },
  {
    key: 'videos',
    icon: '🎬',
    label: '영상 목록 CSV',
    desc: '순위·제목·채널·조회수·좋아요·댓글·재생시간·게시일 포함 전체 트렌딩 영상 목록입니다.',
    color: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
    badge: 'bg-gray-100 text-gray-600',
    badgeLabel: 'CSV',
  },
  {
    key: 'snapshot',
    icon: '📋',
    label: '트렌드 스냅샷 CSV',
    desc: 'KPI 지표와 조회수 구간 분포, 교육 vs 전체 비교 데이터를 포함합니다.',
    color: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
    badge: 'bg-gray-100 text-gray-600',
    badgeLabel: 'CSV',
  },
  {
    key: 'engage',
    icon: '📈',
    label: '참여도 분석 CSV',
    desc: '영상별 좋아요율, 댓글율, 좋아요/댓글 비율을 포함한 참여도 데이터입니다.',
    color: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
    badge: 'bg-gray-100 text-gray-600',
    badgeLabel: 'CSV',
  },
  {
    key: 'pattern',
    icon: '🎯',
    label: '채널·콘텐츠 패턴 CSV',
    desc: '인기 채널 순위, 영상 길이 분포, 업로드 시점 분포 패턴 데이터입니다.',
    color: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
    badge: 'bg-gray-100 text-gray-600',
    badgeLabel: 'CSV',
  },
  {
    key: 'keyword',
    icon: '🔑',
    label: '키워드 TOP 50 CSV',
    desc: '제목 및 태그 빈도 기반 인기 키워드 상위 50개를 내보냅니다.',
    color: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
    badge: 'bg-gray-100 text-gray-600',
    badgeLabel: 'CSV',
  },
] as const;

export default function ReportHub({ videos, eduVideos, regionCode }: Props) {
  const [done, setDone] = useState<string | null>(null);

  const handle = (key: string) => {
    if (!videos.length) return;
    const title = `트렌딩 TOP${videos.length} ${regionCode}`;
    if (key === 'pdf')     printDataAnalysisReport(videos, eduVideos, regionCode);
    else if (key === 'videos')   exportVideosToCSV(videos, title);
    else if (key === 'snapshot') exportSnapshotToCSV(videos, eduVideos, regionCode);
    else if (key === 'engage')   exportEngagementToCSV(videos, regionCode);
    else if (key === 'pattern')  exportChannelPatternToCSV(videos, regionCode);
    else if (key === 'keyword')  exportKeywordsToCSV(videos, regionCode);
    setDone(key);
    setTimeout(() => setDone(null), 2000);
  };

  const empty = !videos.length;

  return (
    <div className="p-5 max-w-3xl space-y-5">
      <div>
        <h2 className="text-base font-bold text-gray-900">리포트 허브</h2>
        <p className="text-sm text-gray-500 mt-1">
          트렌딩 데이터를 PDF·CSV 형식으로 내보냅니다.
          {!empty && (
            <span className="ml-1.5 font-medium text-gray-700">
              ({regionCode} · {videos.length}개 영상 기준)
            </span>
          )}
        </p>
      </div>

      {empty && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
          트렌드 탭에서 데이터를 먼저 불러와야 내보내기가 가능합니다.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXPORTS.map(item => {
          const isDone = done === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handle(item.key)}
              disabled={empty}
              className={`relative flex items-start gap-3 p-4 rounded-2xl border text-left transition-all
                ${empty ? 'opacity-40 cursor-not-allowed border-gray-100 bg-white' : item.color}
                ${isDone ? '!border-green-400 !bg-green-50' : ''}`}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{isDone ? '✅' : item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{item.label}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badge}`}>
                    {item.badgeLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
              {isDone && (
                <span className="absolute top-3 right-3 text-[10px] text-green-600 font-semibold">완료!</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
