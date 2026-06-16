const BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(key: string, path: string, params: URLSearchParams, cache?: RequestInit['cache']) {
  params.set('key', key);
  const res = await fetch(`${BASE_URL}/${path}?${params}`, cache ? { cache } : {});
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `YouTube API 오류 ${res.status}`);
  }
  return res.json();
}

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

export async function fetchComments(key: string, videoId: string, maxResults: number) {
  const params = new URLSearchParams({
    part: 'snippet',
    videoId,
    maxResults: String(Math.min(maxResults, 100)),
    order: 'relevance',
  });
  return ytFetch(key, 'commentThreads', params);
}

export async function fetchCategories(key: string, regionCode: string, hl: string) {
  const params = new URLSearchParams({ part: 'snippet', regionCode, hl });
  return ytFetch(key, 'videoCategories', params);
}
