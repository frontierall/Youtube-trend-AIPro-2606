import { NextRequest, NextResponse } from 'next/server';
import { fetchChannel, fetchUploads } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-youtube-api-key');
  if (!apiKey) return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 401 });

  const handle = request.nextUrl.searchParams.get('handle');
  if (!handle) return NextResponse.json({ error: 'handle이 필요합니다.' }, { status: 400 });

  try {
    const channelData = await fetchChannel(apiKey, handle);
    const channel = channelData.items?.[0];
    if (!channel) return NextResponse.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 });

    const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
    const videosData = uploadsId ? await fetchUploads(apiKey, uploadsId, 12) : { items: [] };

    return NextResponse.json({ channel, videos: videosData.items ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '채널 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
