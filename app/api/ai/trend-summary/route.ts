import { NextRequest, NextResponse } from 'next/server';

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
  if (!res.ok) {
    throw new Error(data?.error?.message || `Claude API 오류 ${res.status}`);
  }
  return data.content?.[0]?.text ?? '';
}

export async function POST(request: NextRequest) {
  const aiKey = request.headers.get('x-ai-api-key');
  if (!aiKey) return NextResponse.json({ error: 'AI API 키가 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.videos?.length) {
    return NextResponse.json({ error: '분석할 영상 목록이 필요합니다.' }, { status: 400 });
  }

  const { regionCode = 'KR', videos } = body;

  const videoList = (videos as { title: string; channel: string; views: string; likes?: string; tags?: string[] }[])
    .slice(0, 30)
    .map((v, i) => {
      const tags = v.tags?.length ? ` [태그: ${v.tags.slice(0, 4).join(', ')}]` : '';
      return `${i + 1}. "${v.title}" — ${v.channel} (조회수 ${parseInt(v.views || '0').toLocaleString()}${tags})`;
    })
    .join('\n');

  const prompt = `당신은 YouTube 트렌드 분석 전문가입니다. 다음은 ${regionCode} 지역의 현재 YouTube 트렌딩 영상 목록입니다:\n\n${videoList}\n\n위 데이터를 분석하여 다음을 한국어로 작성해주세요:\n1. 현재 트렌드의 핵심 특징 (1~2문장)\n2. 주목할 만한 콘텐츠 유형이나 주제 패턴\n3. 반복 등장하는 키워드나 테마\n4. 콘텐츠 창작자에게 유용한 인사이트 한 가지\n\n간결하고 실용적으로 작성해주세요.`;

  try {
    const summary = await callClaude(aiKey, prompt);
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 분석 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
