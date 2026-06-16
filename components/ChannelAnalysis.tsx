'use client';

import { useState } from 'react';
import Image from 'next/image';
import { YouTubeChannel, YouTubeVideo } from '@/types/youtube';
import { formatViewCount, formatRelativeTime, formatDuration } from '@/lib/formatters';
import ReportButton from '@/components/ReportButton';

interface Props {
  apiKey: string;
}

function extractHandle(input: string): string {
  const handleMatch = input.match(/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) return `@${handleMatch[1]}`;

  const channelIdMatch = input.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelIdMatch) return channelIdMatch[1];

  if (/^UC[a-zA-Z0-9_-]{22}$/.test(input.trim())) return input.trim();

  const clean = input.trim();
  return clean.startsWith('@') ? clean : `@${clean}`;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-base font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function ChannelAnalysis({ apiKey }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setChannel(null);
    setVideos([]);

    try {
      const handle = extractHandle(query.trim());
      const res = await fetch(`/api/channel?handle=${encodeURIComponent(handle)}`, {
        headers: { 'x-youtube-api-key': apiKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChannel(data.channel);
      setVideos(data.videos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '채널을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const avatar =
    channel?.snippet.thumbnails.high?.url ||
    channel?.snippet.thumbnails.medium?.url ||
    channel?.snippet.thumbnails.default?.url;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">채널 분석</h2>
        {channel && !loading && (
          <ReportButton
            channel={channel}
            channelVideos={videos}
            reportTitle={`채널 분석 · ${channel.snippet.title}`}
          />
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="채널 이름, @handle, 또는 YouTube 채널 URL"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? '검색 중…' : '검색'}
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
            <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-2">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {channel && !loading && (
        <div className="space-y-5">
          {/* Channel card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src={avatar!}
                  alt={channel.snippet.title}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                      {channel.snippet.title}
                    </h3>
                    {channel.snippet.customUrl && (
                      <p className="text-sm text-gray-400">{channel.snippet.customUrl}</p>
                    )}
                  </div>
                  <a
                    href={`https://youtube.com/channel/${channel.id}`}
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
                {channel.snippet.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {channel.snippet.description}
                  </p>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {!channel.statistics.hiddenSubscriberCount && (
                <StatBox label="구독자" value={formatViewCount(channel.statistics.subscriberCount)} />
              )}
              <StatBox label="총 동영상" value={parseInt(channel.statistics.videoCount).toLocaleString() + '개'} />
              <StatBox label="총 조회수" value={formatViewCount(channel.statistics.viewCount)} />
              <StatBox
                label="채널 개설"
                value={new Date(channel.snippet.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              />
            </div>
          </div>

          {/* Recent videos */}
          {videos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">최근 업로드 영상</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {videos.map((video) => (
                  <a
                    key={video.id}
                    href={`https://youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url}
                        alt={video.snippet.title}
                        fill
                        className="object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-mono">
                        {formatDuration(video.contentDetails.duration)}
                      </span>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                        {video.snippet.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatViewCount(video.statistics?.viewCount)} 조회 · {formatRelativeTime(video.snippet.publishedAt)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !channel && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
          <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">채널 이름, @handle, 또는 URL을 입력해 분석을 시작하세요.</p>
        </div>
      )}
    </div>
  );
}
