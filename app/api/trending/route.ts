import { NextRequest, NextResponse } from 'next/server';
import { fetchTrending } from '@/lib/youtube';

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
    const message = error instanceof Error ? error.message : '급상승 동영상 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
