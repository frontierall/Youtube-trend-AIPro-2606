const BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(key: string, path: string, params: URLSearchParams) {
  params.set('key', key);
  const res = await fetch(`${BASE_URL}/${path}?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `YouTube API 오류 ${res.status}`);
  }
  return res.json();
}

// ── Trending ──────────────────────────────────────────────────────────────────

export async function fetchTrendingPage(
  key: string,
  regionCode: string,
  categoryId: string,
  maxResults: number,
  pageToken?: string
) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode,
    maxResults: String(Math.min(maxResults, 50)),
  });
  if (categoryId && categoryId !== '0') params.set('videoCategoryId', categoryId);
  if (pageToken) params.set('pageToken', pageToken);
  return ytFetch(key, 'videos', params);
}

export async function fetchTrending(
  key: string,
  regionCode: string,
  categoryId: string,
  maxResults: number
) {
  const firstPage = await fetchTrendingPage(key, regionCode, categoryId, Math.min(maxResults, 50));
  let items = firstPage.items ?? [];

  if (maxResults > 50 && firstPage.nextPageToken && items.length >= 50) {
    const secondPage = await fetchTrendingPage(key, regionCode, categoryId, 50, firstPage.nextPageToken);
    items = [...items, ...(secondPage.items ?? [])].slice(0, maxResults);
  }

  return { items: items.slice(0, maxResults) };
}

// search.list 기반 카테고리 조회 (videoCategoryId 파라미터 방식)
export async function fetchByCategory(
  key: string,
  regionCode: string,
  categoryId: string,
  maxResults: number
) {
  const searchParams = new URLSearchParams({
    part: 'id',
    type: 'video',
    videoCategoryId: categoryId,
    regionCode,
    maxResults: String(Math.min(maxResults, 50)),
    order: 'viewCount',
  });
  const searchData = await ytFetch(key, 'search', searchParams);

  const ids = (searchData.items ?? [])
    .map((item: { id: { videoId: string } }) => item.id?.videoId)
    .filter(Boolean)
    .join(',');

  if (!ids) return { items: [] };

  const videoParams = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: ids,
  });
  return ytFetch(key, 'videos', videoParams);
}

// 카테고리 ID → 검색 키워드 매핑 (videoCategoryId deprecated 대응)
const CATEGORY_QUERIES: Record<string, string> = {
  '1':  '영화 애니메이션',
  '2':  '자동차 드라이브',
  '10': '음악 뮤직비디오',
  '15': '동물 반려동물',
  '17': '스포츠 경기',
  '19': '여행 관광',
  '20': '게임 플레이',
  '22': '일상 브이로그',
  '23': '코미디 유머',
  '24': '엔터테인먼트 예능',
  '25': '뉴스 시사',
  '26': '노하우 뷰티 요리',
  '27': '교육 강의 공부 학습',
  '28': '과학 기술 IT',
  '29': '사회 캠페인',
};

// search.list 기반 카테고리 조회 (키워드 검색 방식 — 더 안정적)
export async function fetchByCategorySearch(
  key: string,
  regionCode: string,
  categoryId: string,
  maxResults: number
) {
  const q = CATEGORY_QUERIES[categoryId];
  const params: Record<string, string> = {
    part: 'id',
    type: 'video',
    regionCode,
    maxResults: String(Math.min(maxResults, 50)),
    order: 'viewCount',
  };
  if (q) {
    params.q = q;
    params.relevanceLanguage = regionCode === 'KR' ? 'ko' : 'en';
  } else {
    params.videoCategoryId = categoryId;
  }

  const searchData = await ytFetch(key, 'search', new URLSearchParams(params));
  const ids = (searchData.items ?? [])
    .map((item: { id: { videoId: string } }) => item.id?.videoId)
    .filter(Boolean)
    .join(',');

  if (!ids) return { items: [] };

  return ytFetch(key, 'videos', new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: ids,
  }));
}

// 중복 제거 (id 기준)
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function fetchComments(key: string, videoId: string, maxResults: number) {
  const params = new URLSearchParams({
    part: 'snippet',
    videoId,
    maxResults: String(Math.min(maxResults, 100)),
    order: 'relevance',
  });
  return ytFetch(key, 'commentThreads', params);
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function fetchCategories(key: string, regionCode: string, hl: string) {
  const params = new URLSearchParams({ part: 'snippet', regionCode, hl });
  return ytFetch(key, 'videoCategories', params);
}

// ── Channel Analysis ──────────────────────────────────────────────────────────

export async function fetchChannel(key: string, handleOrId: string) {
  const params = new URLSearchParams({ part: 'snippet,statistics,contentDetails' });
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(handleOrId)) {
    params.set('id', handleOrId);
  } else {
    params.set('forHandle', handleOrId.startsWith('@') ? handleOrId : `@${handleOrId}`);
  }
  return ytFetch(key, 'channels', params);
}

export async function fetchUploads(key: string, uploadsPlaylistId: string, maxResults = 12) {
  const playlistParams = new URLSearchParams({
    part: 'snippet',
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
  });
  const playlist = await ytFetch(key, 'playlistItems', playlistParams);

  const ids = (playlist.items ?? [])
    .map((item: { snippet: { resourceId: { videoId: string } } }) => item.snippet?.resourceId?.videoId)
    .filter(Boolean)
    .join(',');

  if (!ids) return { items: [] };

  const videoParams = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: ids,
  });
  return ytFetch(key, 'videos', videoParams);
}

// ── Video Analysis ────────────────────────────────────────────────────────────

export async function fetchVideoById(key: string, videoId: string) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoId,
  });
  return ytFetch(key, 'videos', params);
}
