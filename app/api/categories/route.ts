import { NextRequest, NextResponse } from 'next/server';
import { fetchCategories } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-youtube-api-key');
  if (!apiKey) return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const regionCode = searchParams.get('regionCode') || 'KR';
  const hl = searchParams.get('hl') || 'ko';

  try {
    const data = await fetchCategories(apiKey, regionCode, hl);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '카테고리 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
