'use client';

import Image from 'next/image';
import { useState } from 'react';
import { YouTubeVideo } from '@/types/youtube';
import { formatViewCount, formatDuration, formatRelativeTime } from '@/lib/formatters';

interface Props {
  video: YouTubeVideo;
  rank: number;
  onCommentClick: (video: YouTubeVideo) => void;
  onAnalyzeClick?: (video: YouTubeVideo) => void;
  isSelectedForAnalysis?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (video: YouTubeVideo) => void;
}

type CopyTarget = 'video' | 'channel' | null;

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default function VideoCard({
  video,
  rank,
  onCommentClick,
  onAnalyzeClick,
  isSelectedForAnalysis = false,
  isFavorite = false,
  onFavoriteToggle,
}: Props) {
  const [copied, setCopied] = useState<CopyTarget>(null);
  const thumb =
    video.snippet.thumbnails.medium?.url ||
    video.snippet.thumbnails.high?.url ||
    video.snippet.thumbnails.default?.url;

  const rankBadgeClass =
    rank === 1
      ? 'bg-yellow-400 text-yellow-900'
      : rank <= 3
        ? 'bg-orange-400 text-white'
        : rank <= 10
          ? 'bg-red-500 text-white'
          : 'bg-gray-900/70 text-white';

  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const channelUrl = `https://www.youtube.com/channel/${video.snippet.channelId}`;

  const handleCopy = async (target: Exclude<CopyTarget, null>, value: string) => {
    await copyText(value);
    setCopied(target);
    window.setTimeout(() => setCopied(null), 1400);
  };

  return (
    <article className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group border ${
      isSelectedForAnalysis ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'
    }`}>
      {/* Thumbnail */}
      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video flex-shrink-0 overflow-hidden"
      >
        <Image
          src={thumb}
          alt={video.snippet.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-mono leading-none">
          {formatDuration(video.contentDetails.duration)}
        </span>
        <span
          className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shadow ${rankBadgeClass}`}
        >
          {rank}
        </span>
      </a>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
          {video.snippet.title}
        </h3>
        <p className="text-xs text-gray-500 truncate">{video.snippet.channelTitle}</p>

        <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <EyeIcon />
            {formatViewCount(video.statistics.viewCount)}
          </span>
          {video.statistics.likeCount && (
            <span className="flex items-center gap-1">
              <ThumbIcon />
              {formatViewCount(video.statistics.likeCount)}
            </span>
          )}
          <span className="ml-auto text-gray-300 text-[11px]">
            {formatRelativeTime(video.snippet.publishedAt)}
          </span>
        </div>

        <div className="mt-1 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleCopy('video', videoUrl)}
            className="flex items-center justify-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            title="영상 URL 복사"
          >
            <LinkIcon />
            {copied === 'video' ? '복사됨' : '영상'}
          </button>
          <button
            type="button"
            onClick={() => handleCopy('channel', channelUrl)}
            className="flex items-center justify-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            title="채널 URL 복사"
          >
            <LinkIcon />
            {copied === 'channel' ? '복사됨' : '채널'}
          </button>
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={() => onFavoriteToggle(video)}
              className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                isFavorite
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              aria-pressed={isFavorite}
            >
              <StarIcon filled={isFavorite} />
              {isFavorite ? '저장됨' : '저장'}
            </button>
          )}
        </div>

        <div className="mt-1 grid grid-cols-1 gap-1.5">
          {onAnalyzeClick && (
            <button
              onClick={() => onAnalyzeClick(video)}
              className={`flex items-center justify-center gap-1.5 w-full text-xs font-medium py-1.5 rounded-lg transition-colors ${
                isSelectedForAnalysis
                  ? 'text-blue-700 bg-blue-100'
                  : 'text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <SparkIcon />
              {isSelectedForAnalysis ? 'AI 선택됨' : 'AI 분석 선택'}
            </button>
          )}
          <button
            onClick={() => onCommentClick(video)}
            className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 rounded-lg transition-colors"
          >
            <CommentIcon />
            댓글 보기
            {video.statistics.commentCount && (
              <span className="text-blue-400">({formatViewCount(video.statistics.commentCount)})</span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function LinkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H15a5 5 0 010 10h-1.5m-3 0H9A5 5 0 019 6h1.5m-2 5h7" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-3 h-3" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.6.6 0 011.04 0l2.33 4.72a.6.6 0 00.452.328l5.21.757a.6.6 0 01.332 1.023l-3.77 3.675a.6.6 0 00-.172.531l.89 5.19a.6.6 0 01-.87.632l-4.66-2.45a.6.6 0 00-.558 0l-4.66 2.45a.6.6 0 01-.87-.632l.89-5.19a.6.6 0 00-.172-.531l-3.77-3.675a.6.6 0 01.332-1.023l5.21-.757a.6.6 0 00.452-.328l2.33-4.72z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function ThumbIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}
