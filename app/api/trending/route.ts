import { NextRequest, NextResponse } from 'next/server';
import { fetchTrending, fetchByCategorySearch, dedupeById } from '@/lib/youtube';

type VideoItem = { id: string; statistics?: { viewCount?: string } };

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-youtube-api-key');
  if (!apiKey) return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const regionCode = searchParams.get('regionCode') || 'KR';
  const categoryId = searchParams.get('categoryId') || '';
  const maxResults = Math.min(parseInt(searchParams.get('maxResults') || '50', 10), 100);

  // 카테고리 지정 시: mostPopular + 키워드 검색을 병렬 호출 후 병합
  if (categoryId) {
    const [trendingResult, searchResult] = await Promise.allSettled([
      fetchTrending(apiKey, regionCode, categoryId, maxResults),
      fetchByCategorySearch(apiKey, regionCode, categoryId, maxResults),
    ]);

    const trendingItems: VideoItem[] =
      trendingResult.status === 'fulfilled' ? (trendingResult.value.items ?? []) : [];
    const searchItems: VideoItem[] =
      searchResult.status === 'fulfilled' ? (searchResult.value.items ?? []) : [];

    if (trendingItems.length === 0 && searchItems.length === 0) {
      const msg =
        trendingResult.status === 'rejected'
          ? (trendingResult.reason as Error)?.message
          : '해당 카테고리의 데이터를 찾을 수 없습니다.';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const merged = dedupeById([...trendingItems, ...searchItems])
      .sort(
        (a, b) =>
          parseInt(b.statistics?.viewCount || '0') -
          parseInt(a.statistics?.viewCount || '0')
      )
      .slice(0, maxResults);

    return NextResponse.json({ items: merged });
  }

  // 카테고리 없는 일반 트렌딩
  try {
    const data = await fetchTrending(apiKey, regionCode, '', maxResults);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '급상승 동영상 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
