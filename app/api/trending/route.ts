import { NextRequest, NextResponse } from 'next/server';
import { fetchTrending, fetchByCategory } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-youtube-api-key');
  if (!apiKey) return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const regionCode = searchParams.get('regionCode') || 'KR';
  const categoryId = searchParams.get('categoryId') || '';
  const maxResults = Math.min(parseInt(searchParams.get('maxResults') || '50', 10), 100);

  try {
    const data = await fetchTrending(apiKey, regionCode, categoryId, maxResults);
    return NextResponse.json(data);
  } catch (error) {
    // trending API가 특정 국가+카테고리 조합을 지원하지 않으면 search.list로 폴백
    if (categoryId) {
      try {
        const fallback = await fetchByCategory(apiKey, regionCode, categoryId, maxResults);
        return NextResponse.json(fallback);
      } catch {
        // 폴백도 실패하면 원래 에러 반환
      }
    }
    const message = error instanceof Error ? error.message : '급상승 동영상 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
