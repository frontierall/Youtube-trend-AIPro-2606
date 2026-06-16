'use client';

import { useCallback, useEffect, useRef, startTransition, useState } from 'react';
import Header from '@/components/Header';
import ApiBanner from '@/components/ApiBanner';
import TopNav, { type TopMenu } from '@/components/TopNav';
import SideNav from '@/components/SideNav';
import FilterBar from '@/components/FilterBar';
import VideoCard from '@/components/VideoCard';
import CommentsModal from '@/components/CommentsModal';
import ChannelAnalysis from '@/components/ChannelAnalysis';
import VideoAnalysis from '@/components/VideoAnalysis';
import ReportButton from '@/components/ReportButton';
import { useApiKey } from '@/hooks/useApiKey';
import { YouTubeVideo, YouTubeCategory } from '@/types/youtube';

type SideMenu = 'trending-all' | 'trending-education' | 'channel' | 'video';

const SIDE_MENUS: Record<TopMenu, { id: SideMenu; label: string; icon: string }[]> = {
  trend: [
    { id: 'trending-all', label: '전체 트렌딩 TOP 50', icon: '🔥' },
    { id: 'trending-education', label: '교육 TOP 30', icon: '📚' },
  ],
  analysis: [
    { id: 'channel', label: '채널 분석', icon: '📺' },
    { id: 'video', label: '영상 분석', icon: '🎬' },
  ],
};

const EDUCATION_CATEGORY_ID = '27';

async function loadTrending(
  apiKey: string,
  regionCode: string,
  categoryId: string,
  maxResults: number
): Promise<YouTubeVideo[]> {
  const params = new URLSearchParams({ regionCode, maxResults: String(maxResults) });
  if (categoryId) params.set('categoryId', categoryId);
  const res = await fetch(`/api/trending?${params}`, {
    headers: { 'x-youtube-api-key': apiKey },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '급상승 동영상 조회 실패');
  return data.items ?? [];
}

async function loadCategories(apiKey: string, regionCode: string): Promise<YouTubeCategory[]> {
  const hl = regionCode === 'KR' ? 'ko' : 'en';
  const res = await fetch(`/api/categories?regionCode=${regionCode}&hl=${hl}`, {
    headers: { 'x-youtube-api-key': apiKey },
  });
  const data = await res.json();
  if (!res.ok) return [];
  return data.items ?? [];
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
          <div className="aspect-video bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-8 bg-gray-100 rounded-lg w-full mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { apiKey, saveKey, clearKey, loaded } = useApiKey();
  const [bannerOpen, setBannerOpen] = useState(false);
  const showBanner = !apiKey || bannerOpen;

  // Navigation
  const [topMenu, setTopMenu] = useState<TopMenu>('trend');
  const [sideMenu, setSideMenu] = useState<SideMenu>('trending-all');

  // Trend state
  const [regionCode, setRegionCode] = useState('KR');
  const [categoryId, setCategoryId] = useState('');
  const [maxResults, setMaxResults] = useState(50);

  const [trendingVideos, setTrendingVideos] = useState<YouTubeVideo[]>([]);
  const [educationVideos, setEducationVideos] = useState<YouTubeVideo[]>([]);
  const [categories, setCategories] = useState<YouTubeCategory[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [educationLoading, setEducationLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [educationError, setEducationError] = useState<string | null>(null);

  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const fetchTrending = useCallback(async (key: string, region: string, catId: string, count: number) => {
    setTrendingLoading(true);
    setTrendingError(null);
    try {
      setTrendingVideos(await loadTrending(key, region, catId, count));
    } catch (err) {
      setTrendingError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  const fetchEducation = useCallback(async (key: string, region: string) => {
    setEducationLoading(true);
    setEducationError(null);
    try {
      setEducationVideos(await loadTrending(key, region, EDUCATION_CATEGORY_ID, 30));
    } catch (err) {
      setEducationError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setEducationLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (key: string, region: string) => {
    setCategories(await loadCategories(key, region));
  }, []);

  const initialized = useRef(false);

  const initData = useCallback((key: string, region: string, count: number) => {
    initialized.current = true;
    fetchCategories(key, region);
    fetchTrending(key, region, '', count);
    fetchEducation(key, region);
  }, [fetchCategories, fetchTrending, fetchEducation]);

  useEffect(() => {
    if (!loaded || !apiKey || initialized.current) return;
    initData(apiKey, regionCode, maxResults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, apiKey]);

  const prevRegion = useRef(regionCode);
  useEffect(() => {
    if (!initialized.current || prevRegion.current === regionCode) return;
    prevRegion.current = regionCode;
    setCategoryId('');
    fetchCategories(apiKey, regionCode);
    fetchTrending(apiKey, regionCode, '', maxResults);
    fetchEducation(apiKey, regionCode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionCode]);

  const prevCat = useRef(categoryId);
  const prevCount = useRef(maxResults);
  useEffect(() => {
    if (!initialized.current) return;
    if (prevCat.current === categoryId && prevCount.current === maxResults) return;
    prevCat.current = categoryId;
    prevCount.current = maxResults;
    fetchTrending(apiKey, regionCode, categoryId, maxResults);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, maxResults]);

  const handleTopMenuChange = (menu: TopMenu) => {
    startTransition(() => {
      setTopMenu(menu);
      setSideMenu(SIDE_MENUS[menu][0].id);
    });
  };

  const handleSaveKey = (key: string) => {
    saveKey(key);
    setBannerOpen(false);
    if (!initialized.current) initData(key, regionCode, maxResults);
  };

  const handleRefresh = () => {
    if (sideMenu === 'trending-all') fetchTrending(apiKey, regionCode, categoryId, maxResults);
    if (sideMenu === 'trending-education') fetchEducation(apiKey, regionCode);
  };

  const isTrend = topMenu === 'trend';
  const videos = sideMenu === 'trending-all' ? trendingVideos : educationVideos;
  const loading = sideMenu === 'trending-all' ? trendingLoading : educationLoading;
  const error = sideMenu === 'trending-all' ? trendingError : educationError;
  const showFilterBar = isTrend;

  if (!loaded) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header hasApiKey={!!apiKey} onKeyClick={() => setBannerOpen(true)} />

      {/* API Key Banner */}
      {showBanner && (
        <ApiBanner
          hasKey={!!apiKey}
          onSave={handleSaveKey}
          onClose={apiKey ? () => setBannerOpen(false) : undefined}
        />
      )}

      {/* Top navigation (상위 카테고리) */}
      <TopNav active={topMenu} onChange={handleTopMenuChange} />

      {/* Body: sidebar + content */}
      <div className="flex flex-1">
        {/* Left sidebar (하위 카테고리) */}
        <SideNav
          items={SIDE_MENUS[topMenu]}
          active={sideMenu}
          onChange={(id) => startTransition(() => setSideMenu(id as SideMenu))}
        />

        {/* Right content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* FilterBar — trend only, sticky */}
          {showFilterBar && (
            <FilterBar
              regionCode={regionCode}
              categoryId={categoryId}
              categories={categories}
              maxResults={maxResults}
              showCategory={sideMenu === 'trending-all'}
              showMaxResults={sideMenu === 'trending-all'}
              loading={loading}
              onRegionChange={setRegionCode}
              onCategoryChange={setCategoryId}
              onMaxResultsChange={setMaxResults}
              onRefresh={handleRefresh}
            />
          )}

          {/* Main content */}
          <main className="flex-1 px-5 py-5">
            {/* No key */}
            {!apiKey && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
                <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <p className="text-sm">위 배너에서 API 키를 입력해주세요.</p>
              </div>
            )}

            {/* Analysis pages */}
            {apiKey && sideMenu === 'channel' && <ChannelAnalysis apiKey={apiKey} />}
            {apiKey && sideMenu === 'video' && <VideoAnalysis apiKey={apiKey} />}

            {/* Trending content */}
            {apiKey && isTrend && (
              <>
                <div className="flex items-center justify-between mb-4 min-h-[36px]">
                  <div>
                    {!loading && !error && videos.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {sideMenu === 'trending-all' ? '급상승 동영상' : '교육 분야 인기 동영상'}{' '}
                        <span className="font-semibold text-gray-800">{videos.length}개</span>
                      </p>
                    )}
                    {loading && videos.length > 0 && (
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin inline-block" />
                        업데이트 중...
                      </p>
                    )}
                  </div>
                  {!loading && !error && videos.length > 0 && (
                    <ReportButton
                      videos={videos}
                      reportTitle={
                        sideMenu === 'trending-all'
                          ? `전체 트렌딩 TOP${videos.length} ${regionCode}`
                          : `교육 TOP30 ${regionCode}`
                      }
                      reportSubtitle={`${regionCode} 기준`}
                    />
                  )}
                </div>

                {error && !loading && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <p className="text-red-600 font-medium text-sm">{error}</p>
                    <button onClick={handleRefresh} className="mt-3 text-sm text-red-500 underline underline-offset-2">
                      다시 시도
                    </button>
                  </div>
                )}

                {loading && videos.length === 0 && <SkeletonGrid />}

                {(!loading || videos.length > 0) && !error && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {videos.map((video, i) => (
                      <VideoCard key={video.id} video={video} rank={i + 1} onCommentClick={setSelectedVideo} />
                    ))}
                  </div>
                )}

                {!loading && !error && videos.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">표시할 동영상이 없습니다.</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Comments Modal */}
      {selectedVideo && (
        <CommentsModal
          video={selectedVideo}
          apiKey={apiKey}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
