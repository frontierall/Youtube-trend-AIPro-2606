'use client';

import { useState } from 'react';
import Image from 'next/image';
import { YouTubeVideo, YouTubeCommentThread } from '@/types/youtube';
import { formatViewCount, formatDuration, formatRelativeTime } from '@/lib/formatters';

interface Props {
  apiKey: string;
}

function extractVideoId(input: string): string | null {
  const s = input.trim();
  const short = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const long = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (long) return long[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  return null;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-base font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function VideoAnalysis({ apiKey }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [comments, setComments] = useState<YouTubeCommentThread[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const videoId = extractVideoId(query.trim());
    if (!videoId) {
      setError('올바른 YouTube 영상 URL 또는 영상 ID(11자리)를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setVideo(null);
    setComments([]);

    try {
      const res = await fetch(`/api/video?id=${videoId}`, {
        headers: { 'x-youtube-api-key': apiKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideo(data.video);
      setComments(data.comments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '영상을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const thumb = video
    ? video.snippet.thumbnails.maxres?.url ||
      video.snippet.thumbnails.high?.url ||
      video.snippet.thumbnails.medium?.url ||
      video.snippet.thumbnails.default?.url
    : '';

  return (
    <div className="p-6 max-w-5xl">
      <h2 className="text-base font-bold text-gray-800 mb-4">영상 분석</h2>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="YouTube 영상 URL 또는 영상 ID 입력"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? '분석 중…' : '분석'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 flex gap-4">
            <div className="w-52 bg-gray-200 rounded-xl flex-shrink-0" style={{ aspectRatio: '16/9' }} />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mt-3" />
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {video && !loading && (
        <div className="space-y-5">
          {/* Video card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex gap-4">
              <a
                href={`https://youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex-shrink-0 rounded-xl overflow-hidden group"
                style={{ width: '208px', aspectRatio: '16/9' }}
              >
                <Image
                  src={thumb}
                  alt={video.snippet.title}
                  fill
                  className="object-cover group-hover:opacity-90 transition-opacity"
                />
                <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-mono">
                  {formatDuration(video.contentDetails.duration)}
                </span>
              </a>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 text-base leading-snug">
                    {video.snippet.title}
                  </h3>
                  <a
                    href={`https://youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 bg-gray-50 hover:bg-red-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    YouTube 열기
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <a
                  href={`https://youtube.com/channel/${video.snippet.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline mt-0.5 inline-block"
                >
                  {video.snippet.channelTitle}
                </a>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatRelativeTime(video.snippet.publishedAt)}
                </p>

                {/* Tags */}
                {video.snippet.tags && video.snippet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {video.snippet.tags.slice(0, 8).map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <StatBox label="조회수" value={formatViewCount(video.statistics.viewCount)} />
              <StatBox label="좋아요" value={video.statistics.likeCount ? formatViewCount(video.statistics.likeCount) : '비공개'} />
              <StatBox label="댓글" value={video.statistics.commentCount ? formatViewCount(video.statistics.commentCount) : '비공개'} />
            </div>
          </div>

          {/* Comments */}
          {comments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                인기 댓글
                <span className="ml-1.5 text-gray-400 font-normal">({comments.length}개 표시)</span>
              </h4>
              <div className="space-y-3">
                {comments.map((thread) => {
                  const c = thread.snippet.topLevelComment.snippet;
                  return (
                    <div key={thread.id} className="flex gap-3 bg-white rounded-xl p-3.5 border border-gray-100">
                      <div className="relative w-7 h-7 flex-shrink-0">
                        <Image
                          src={c.authorProfileImageUrl}
                          alt={c.authorDisplayName}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-800">{c.authorDisplayName}</span>
                          <span className="text-xs text-gray-400">{formatRelativeTime(c.publishedAt)}</span>
                        </div>
                        <p
                          className="text-sm text-gray-700 mt-1 leading-relaxed break-words"
                          dangerouslySetInnerHTML={{ __html: c.textDisplay }}
                        />
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          {c.likeCount > 0 && <span>👍 {c.likeCount.toLocaleString()}</span>}
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
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !video && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
          <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">YouTube 영상 URL이나 영상 ID를 입력해 분석을 시작하세요.</p>
        </div>
      )}
    </div>
  );
}
