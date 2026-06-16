'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { YouTubeVideo, YouTubeCommentThread } from '@/types/youtube';
import { formatViewCount, formatRelativeTime } from '@/lib/formatters';

interface Props {
  video: YouTubeVideo;
  apiKey: string;
  maxResults: number;
  onClose: () => void;
}

export default function CommentsModal({ video, apiKey, maxResults, onClose }: Props) {
  const [comments, setComments] = useState<YouTubeCommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const thumb =
    video.snippet.thumbnails.medium?.url ||
    video.snippet.thumbnails.default?.url;

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/comments?videoId=${video.id}&maxResults=${maxResults}`,
          { signal: controller.signal, headers: { 'x-youtube-api-key': apiKey } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '댓글을 불러오지 못했습니다.');
        setComments(data.items ?? []);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : '댓글을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [apiKey, maxResults, video.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-100">
          <div className="relative w-24 h-[54px] flex-shrink-0 rounded-lg overflow-hidden">
            <Image src={thumb} alt={video.snippet.title} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">
              {video.snippet.title}
            </h2>
            <p className="text-gray-500 text-xs mt-1">{video.snippet.channelTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Subheader */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-sm text-gray-600">
            전체 댓글{' '}
            <span className="font-semibold text-gray-900">
              {formatViewCount(video.statistics.commentCount)}
            </span>
            개
            {!loading && comments.length > 0 && (
              <span className="text-gray-400 text-xs ml-1">
                (인기 댓글 {comments.length}개 표시)
              </span>
            )}
          </p>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-[3px] border-red-200 border-t-red-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">댓글 불러오는 중...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-sm font-medium text-gray-500">{error}</p>
              <p className="text-xs text-gray-400">
                댓글이 비활성화됐거나 접근이 제한된 영상입니다.
              </p>
            </div>
          )}

          {!loading && !error && comments.length === 0 && (
            <p className="text-center py-12 text-sm text-gray-400">댓글이 없습니다.</p>
          )}

          {!loading &&
            !error &&
            comments.map((thread) => {
              const c = thread.snippet.topLevelComment.snippet;
              return (
                <div key={thread.id} className="flex gap-3">
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <Image
                      src={c.authorProfileImageUrl}
                      alt={c.authorDisplayName}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {c.authorDisplayName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(c.publishedAt)}
                      </span>
                    </div>
                    <p
                      className="text-sm text-gray-700 mt-1 leading-relaxed break-words"
                      dangerouslySetInnerHTML={{ __html: c.textDisplay }}
                    />
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      {c.likeCount > 0 && (
                        <span className="flex items-center gap-1">
                          👍 {c.likeCount.toLocaleString()}
                        </span>
                      )}
                      {thread.snippet.totalReplyCount > 0 && (
                        <span>답글 {thread.snippet.totalReplyCount}개</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
