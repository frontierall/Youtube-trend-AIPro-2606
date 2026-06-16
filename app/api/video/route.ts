import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoById, fetchComments } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-youtube-api-key');
  if (!apiKey) return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 401 });

  const videoId = request.nextUrl.searchParams.get('id');
  if (!videoId) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  try {
    const [videoData, commentsData] = await Promise.all([
      fetchVideoById(apiKey, videoId),
      fetchComments(apiKey, videoId, 30).catch(() => ({ items: [] })),
    ]);

    const video = videoData.items?.[0];
    if (!video) return NextResponse.json({ error: '영상을 찾을 수 없습니다.' }, { status: 404 });

    return NextResponse.json({ video, comments: commentsData.items ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '영상 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
