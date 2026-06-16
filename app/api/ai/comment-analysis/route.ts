import { NextRequest, NextResponse } from 'next/server';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

async function fetchVideoInfo(ytKey: string, videoId: string) {
  const res = await fetch(
    `${YT_BASE}/videos?part=snippet,statistics&id=${videoId}&key=${ytKey}`
  );
  const data = await res.json();
  return data.items?.[0] ?? null;
}

async function fetchComments(ytKey: string, videoId: string) {
  const params = new URLSearchParams({
    part: 'snippet',
    videoId,
    maxResults: '50',
    order: 'relevance',
    key: ytKey,
  });
  const res = await fetch(`${YT_BASE}/commentThreads?${params}`);
  const data = await res.json();
  return (data.items ?? []) as { snippet: { topLevelComment: { snippet: { textDisplay: string; likeCount: number } } } }[];
}

async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Claude API 오류 ${res.status}`);
  return data.content?.[0]?.text ?? '';
}

export async function POST(request: NextRequest) {
  const aiKey = request.headers.get('x-ai-api-key');
  const ytKey = request.headers.get('x-youtube-api-key');

  if (!aiKey) return NextResponse.json({ error: 'AI API 키가 필요합니다.' }, { status: 401 });
  if (!ytKey) return NextResponse.json({ error: 'YouTube API 키가 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.videoId) {
    return NextResponse.json({ error: '영상 ID가 필요합니다.' }, { status: 400 });
  }

  const { videoId } = body;

  // YouTube 데이터 병렬 조회
  const [video, comments] = await Promise.all([
    fetchVideoInfo(ytKey, videoId).catch(() => null),
    fetchComments(ytKey, videoId).catch(() => []),
  ]);

  if (!video) {
    return NextResponse.json({ error: '영상을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!comments.length) {
    return NextResponse.json({ error: '댓글을 불러올 수 없습니다. (비공개 또는 댓글 없음)' }, { status: 400 });
  }

  const videoTitle = video.snippet?.title ?? '';
  const commentTexts = comments
    .slice(0, 40)
    .map((c, i) => {
      const text = c.snippet.topLevelComment.snippet.textDisplay
        .replace(/<[^>]+>/g, '')
        .slice(0, 200);
      const likes = c.snippet.topLevelComment.snippet.likeCount;
      return `${i + 1}. (좋아요 ${likes}) ${text}`;
    })
    .join('\n');

  const prompt = `다음은 YouTube 영상 "${videoTitle}"의 인기 댓글 목록입니다:\n\n${commentTexts}\n\n위 댓글들을 분석하여 JSON 형식으로 응답해주세요. 반드시 아래 형식만 출력하세요:\n{"overall":"긍정|중립|부정","positive":숫자,"neutral":숫자,"negative":숫자,"themes":["테마1","테마2","테마3"],"summary":"2~3문장 종합 분석"}\n\npositive+neutral+negative 합계는 100이어야 합니다. themes는 3~5개의 핵심 반응 테마입니다.`;

  try {
    const raw = await callClaude(aiKey, prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답 형식 오류');

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ result, videoTitle });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 댓글 분석 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
