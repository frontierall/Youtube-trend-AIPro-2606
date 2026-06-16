'use client';

import { useEffect, useRef, useState } from 'react';
import type { YouTubeChannel, YouTubeCommentThread, YouTubeVideo } from '@/types/youtube';
import {
  exportVideosToCSV,
  exportCommentsToCSV,
  exportKeywordsToCSV,
  printVideoReport,
  printChannelReport,
  printCommentsReport,
} from '@/lib/reports';

interface Props {
  videos?: YouTubeVideo[];
  comments?: YouTubeCommentThread[];
  channel?: YouTubeChannel;
  channelVideos?: YouTubeVideo[];
  reportTitle: string;
  reportSubtitle?: string;
}

export default function ReportButton({
  videos,
  comments,
  channel,
  channelVideos,
  reportTitle,
  reportSubtitle = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const hasVideos = videos && videos.length > 0;
  const hasComments = comments && comments.length > 0;
  const hasChannel = !!channel;

  type Item = { label: string; action: () => void };

  const items: Item[] = [
    ...(hasVideos
      ? [
          {
            label: '📊 영상 목록 CSV',
            action: () => exportVideosToCSV(videos, reportTitle),
          },
          {
            label: '🔑 키워드 트렌드 CSV',
            action: () => exportKeywordsToCSV(videos, reportTitle),
          },
          {
            label: '🖨️ 영상 리포트 PDF 인쇄',
            action: () => printVideoReport(videos, reportTitle, reportSubtitle),
          },
        ]
      : []),
    ...(hasComments
      ? [
          {
            label: '💬 댓글 CSV',
            action: () => exportCommentsToCSV(comments, reportTitle),
          },
          {
            label: '🖨️ 댓글 리포트 PDF 인쇄',
            action: () => printCommentsReport(comments, reportTitle),
          },
        ]
      : []),
    ...(hasChannel
      ? [
          {
            label: '📺 채널 분석 PDF 인쇄',
            action: () => printChannelReport(channel, channelVideos ?? []),
          },
        ]
      : []),
  ];

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        리포트 생성
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
