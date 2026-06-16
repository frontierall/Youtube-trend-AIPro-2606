'use client';

import { YouTubeCategory } from '@/types/youtube';

export const COUNTRIES = [
  { code: 'KR', name: '🇰🇷 대한민국' },
  { code: 'US', name: '🇺🇸 미국' },
  { code: 'JP', name: '🇯🇵 일본' },
  { code: 'GB', name: '🇬🇧 영국' },
  { code: 'DE', name: '🇩🇪 독일' },
  { code: 'FR', name: '🇫🇷 프랑스' },
  { code: 'IN', name: '🇮🇳 인도' },
  { code: 'BR', name: '🇧🇷 브라질' },
  { code: 'AU', name: '🇦🇺 호주' },
  { code: 'CA', name: '🇨🇦 캐나다' },
  { code: 'MX', name: '🇲🇽 멕시코' },
  { code: 'IT', name: '🇮🇹 이탈리아' },
  { code: 'ES', name: '🇪🇸 스페인' },
  { code: 'RU', name: '🇷🇺 러시아' },
  { code: 'TW', name: '🇹🇼 대만' },
  { code: 'SG', name: '🇸🇬 싱가포르' },
  { code: 'TH', name: '🇹🇭 태국' },
  { code: 'ID', name: '🇮🇩 인도네시아' },
  { code: 'PH', name: '🇵🇭 필리핀' },
  { code: 'VN', name: '🇻🇳 베트남' },
];

interface Props {
  regionCode: string;
  categoryId: string;
  categories: YouTubeCategory[];
  maxResults: number;
  showCategory: boolean;
  showMaxResults: boolean;
  loading: boolean;
  onRegionChange: (code: string) => void;
  onCategoryChange: (id: string) => void;
  onMaxResultsChange: (n: number) => void;
  onRefresh: () => void;
}

export default function FilterBar({
  regionCode,
  categoryId,
  categories,
  maxResults,
  showCategory,
  showMaxResults,
  loading,
  onRegionChange,
  onCategoryChange,
  onMaxResultsChange,
  onRefresh,
}: Props) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center gap-2.5">

        <FilterSelect
          label="국가"
          value={regionCode}
          onChange={onRegionChange}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </FilterSelect>

        {showCategory && (
          <FilterSelect
            label="카테고리"
            value={categoryId}
            onChange={onCategoryChange}
          >
            <option value="">전체</option>
            {categories
              .filter((c) => c.snippet.assignable)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.snippet.title}</option>
              ))}
          </FilterSelect>
        )}

        {showMaxResults && (
          <FilterSelect
            label="표시 수"
            value={String(maxResults)}
            onChange={(v) => onMaxResultsChange(parseInt(v, 10))}
          >
            <option value="10">10개</option>
            <option value="25">25개</option>
            <option value="50">50개</option>
            <option value="100">100개</option>
          </FilterSelect>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? '로딩 중...' : '새로고침'}
        </button>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 min-w-[120px]"
      >
        {children}
      </select>
    </div>
  );
}
