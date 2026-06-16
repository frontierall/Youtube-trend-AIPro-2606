'use client';

import { useState, useRef, useEffect } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import {
  printDataAnalysisReport,
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

const ITEMS = [
  { key: 'pdf',      icon: '🖨️', label: '통합 리포트 PDF 인쇄',   sub: '스냅샷·참여도·채널·키워드' },
  { key: 'snapshot', icon: '📋', label: '트렌드 스냅샷 CSV',       sub: 'KPI + 조회수 구간 분포' },
  { key: 'engage',   icon: '📈', label: '참여도 분석 CSV',         sub: '영상별 좋아요율·댓글율' },
  { key: 'pattern',  icon: '🎯', label: '채널·콘텐츠 패턴 CSV',    sub: '채널 순위·길이·업로드 시점' },
  { key: 'keyword',  icon: '🔑', label: '키워드 TOP 50 CSV',       sub: '제목·태그 빈도 기반' },
];

export default function DataAnalysisReportButton({ videos, eduVideos, regionCode }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handle = (key: string) => {
    setOpen(false);
    if (!videos.length) return;
    if (key === 'pdf')      printDataAnalysisReport(videos, eduVideos, regionCode);
    else if (key === 'snapshot') exportSnapshotToCSV(videos, eduVideos, regionCode);
    else if (key === 'engage')   exportEngagementToCSV(videos, regionCode);
    else if (key === 'pattern')  exportChannelPatternToCSV(videos, regionCode);
    else if (key === 'keyword')  exportKeywordsToCSV(videos, regionCode);
  };

  const disabled = !videos.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl border transition-colors
          bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300
          disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        <span>📥</span>
        내보내기
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {ITEMS.map((item, i) => (
            <button
              key={item.key}
              onClick={() => handle(item.key)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors
                ${i === 0 ? 'border-b border-gray-100' : ''}`}
            >
              <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
