'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { YouTubeVideo } from '@/types/youtube';
import { COUNTRIES } from '@/components/FilterBar';
import { formatViewCount, formatDuration } from '@/lib/formatters';

function toNum(s?: string) { return parseInt(s || '0') || 0; }

const CATEGORY_NAMES: Record<string, string> = {
  '1': '영화·애니메이션', '2': '자동차', '10': '음악', '15': '반려동물',
  '17': '스포츠', '19': '여행', '20': '게임', '22': '블로그',
  '23': '코미디', '24': '엔터테인먼트', '25': '뉴스·정치',
  '26': '하우투·스타일', '27': '교육', '28': '과학·기술', '29': '비영리',
};

async function fetchTop10(apiKey: string, region: string): Promise<YouTubeVideo[]> {
  const params = new URLSearchParams({ regionCode: region, maxResults: '10' });
  const res = await fetch(`/api/trending?${params}`, {
    headers: { 'x-youtube-api-key': apiKey },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '조회 실패');
  return data.items ?? [];
}

function countryFlag(code: string): string {
  const entry = COUNTRIES.find(c => c.code === code);
  if (!entry) return code;
  const flag = entry.name.split(' ')[0];
  return `${flag} ${code}`;
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
    </div>
  );
}

interface Props {
  apiKey: string;
  activeSide: string;
}

export default function CountryCompare({ apiKey, activeSide }: Props) {
  const [regionA, setRegionA] = useState('KR');
  const [regionB, setRegionB] = useState('US');
  const [videosA, setVideosA] = useState<YouTubeVideo[]>([]);
  const [videosB, setVideosB] = useState<YouTubeVideo[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  const loadA = useCallback(async (region: string) => {
    setLoadingA(true); setErrorA(null);
    try { setVideosA(await fetchTop10(apiKey, region)); }
    catch (e) { setErrorA(e instanceof Error ? e.message : '오류'); }
    finally { setLoadingA(false); }
  }, [apiKey]);

  const loadB = useCallback(async (region: string) => {
    setLoadingB(true); setErrorB(null);
    try { setVideosB(await fetchTop10(apiKey, region)); }
    catch (e) { setErrorB(e instanceof Error ? e.message : '오류'); }
    finally { setLoadingB(false); }
  }, [apiKey]);

  useEffect(() => { loadA(regionA); }, [regionA, loadA]);
  useEffect(() => { loadB(regionB); }, [regionB, loadB]);

  const idsA = new Set(videosA.map(v => v.id));
  const idsB = new Set(videosB.map(v => v.id));
  const common = videosA.filter(v => idsB.has(v.id));

  return (
    <div className="p-5 max-w-5xl space-y-5">
      {/* Region selectors */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">국가 A</span>
            <select value={regionA} onChange={e => setRegionA(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400">
              {COUNTRIES.filter(c => c.code !== regionB).map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <span className="text-gray-300 font-bold text-lg">vs</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">국가 B</span>
            <select value={regionB} onChange={e => setRegionB(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400">
              {COUNTRIES.filter(c => c.code !== regionA).map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <p className="ml-auto text-xs text-gray-400">각 국가 TOP 10 기준</p>
        </div>
      </div>

      {/* 나란히 보기 */}
      {activeSide === 'compare-side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: countryFlag(regionA), videos: videosA, loading: loadingA, error: errorA, color: 'text-red-600', badge: 'bg-red-100 text-red-700' },
            { label: countryFlag(regionB), videos: videosB, loading: loadingB, error: errorB, color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
          ].map(({ label, videos, loading, error, color, badge }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className={`text-sm font-semibold mb-3 ${color}`}>{label} TOP 10</h3>
              {loading && <Spinner />}
              {error && <p className="text-xs text-red-500 py-4 text-center">{error}</p>}
              {!loading && !error && (
                <div className="space-y-1.5">
                  {videos.map((v, i) => {
                    const thumb = v.snippet.thumbnails.default?.url;
                    const isCommon = (label.includes(regionA) ? idsB : idsA).has(v.id);
                    return (
                      <a key={v.id}
                        href={`https://youtube.com/watch?v=${v.id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
                        <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                        {thumb && (
                          <div className="relative w-12 h-7 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                            <Image src={thumb} alt={v.snippet.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate group-hover:text-red-600 transition-colors">
                            {v.snippet.title}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{v.snippet.channelTitle}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <p className="text-[10px] font-semibold text-gray-600">{formatViewCount(v.statistics.viewCount)}</p>
                          {isCommon && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">공통</span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                  {!videos.length && (
                    <p className="text-xs text-gray-400 text-center py-4">데이터 없음</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 공통 영상 */}
      {activeSide === 'compare-common' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">양국 공통 트렌딩 영상</h3>
            {(loadingA || loadingB) ? (
              <span className="text-xs text-gray-400">로딩 중...</span>
            ) : (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                {common.length}개 일치
              </span>
            )}
          </div>
          {(loadingA || loadingB) && <Spinner />}
          {!loadingA && !loadingB && common.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-2 text-gray-300">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{countryFlag(regionA)}와 {countryFlag(regionB)} 공통 영상이 없습니다.</p>
            </div>
          )}
          {!loadingA && !loadingB && common.length > 0 && (
            <div className="space-y-2">
              {common.map((v, i) => {
                const rankA = videosA.findIndex(x => x.id === v.id) + 1;
                const rankB = videosB.findIndex(x => x.id === v.id) + 1;
                const thumb = v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url;
                return (
                  <a key={v.id}
                    href={`https://youtube.com/watch?v=${v.id}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                    <span className="text-sm font-bold text-green-600 w-4 flex-shrink-0">{i + 1}</span>
                    <div className="relative w-16 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {thumb && <Image src={thumb} alt={v.snippet.title} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-red-600 transition-colors">
                        {v.snippet.title}
                      </p>
                      <p className="text-[10px] text-gray-400">{v.snippet.channelTitle}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                        {countryFlag(regionA)} #{rankA}
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {countryFlag(regionB)} #{rankB}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 카테고리 비교 */}
      {activeSide === 'compare-category' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: countryFlag(regionA), videos: videosA, loading: loadingA, color: 'bg-red-400'  },
            { label: countryFlag(regionB), videos: videosB, loading: loadingB, color: 'bg-blue-400' },
          ].map(({ label, videos, loading, color }) => {
            const catMap: Record<string, number> = {};
            for (const v of videos) {
              const name = CATEGORY_NAMES[v.snippet.categoryId] ?? `카테고리 ${v.snippet.categoryId}`;
              catMap[name] = (catMap[name] || 0) + 1;
            }
            const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
            const maxCnt = Math.max(...cats.map(c => c[1]), 1);
            return (
              <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{label} 카테고리</h3>
                {loading && <Spinner />}
                {!loading && cats.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">데이터 없음</p>
                )}
                {!loading && cats.length > 0 && (
                  <div className="space-y-2.5">
                    {cats.map(([name, cnt]) => (
                      <div key={name} className="flex items-center gap-2.5">
                        <span className="text-xs text-gray-700 w-28 flex-shrink-0 truncate">{name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className={`${color} h-2 rounded-full`} style={{ width: `${(cnt / maxCnt) * 100}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-5 text-right">{cnt}</span>
                        <span className="text-xs text-gray-400 w-9 text-right">{Math.round(cnt / videos.length * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
