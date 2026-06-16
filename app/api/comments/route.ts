import { NextRequest, NextResponse } from 'next/server';
import { fetchComments } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-youtube-api-key');
  if (!apiKey) return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const videoId = searchParams.get('videoId');
  const maxResults = Math.min(parseInt(searchParams.get('maxResults') || '50', 10), 100);

  if (!videoId) return NextResponse.json({ error: 'videoId가 필요합니다.' }, { status: 400 });

  try {
    const data = await fetchComments(apiKey, videoId, maxResults);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '댓글 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
