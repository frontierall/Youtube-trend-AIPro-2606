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
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Claude API 오류 ${res.status}`);
  return data.content?.[0]?.text ?? '';
}

export async function POST(request: NextRequest) {
  const aiKey = request.headers.get('x-ai-api-key');
  if (!aiKey) return NextResponse.json({ error: 'AI API 키가 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.videos?.length) {
    return NextResponse.json({ error: '분석할 영상 목록이 필요합니다.' }, { status: 400 });
  }

  const { regionCode = 'KR', niche = '', videos } = body;

  const nicheContext = niche ? `관심 분야: ${niche}` : '전체 카테고리';
  const videoList = (videos as {
    title: string; channel: string; views: string;
    likes?: string; duration: string; tags?: string[]; publishedAt: string;
  }[])
    .slice(0, 30)
    .map((v, i) => {
      const tags = v.tags?.length ? ` [${v.tags.slice(0, 3).join(', ')}]` : '';
      return `${i + 1}. "${v.title}"${tags} — ${v.channel} (${parseInt(v.views || '0').toLocaleString()} 조회)`;
    })
    .join('\n');

  const prompt = `당신은 YouTube 콘텐츠 전략 전문가입니다.\n\n지역: ${regionCode}\n${nicheContext}\n\n현재 트렌딩 영상:\n${videoList}\n\n위 데이터를 분석하여 아래 JSON 형식으로만 응답해주세요:\n{\n  "recommendedTopics": ["주제1","주제2","주제3","주제4","주제5"],\n  "optimalLength": "권장 영상 길이 (예: 8~15분)",\n  "bestUploadTime": "최적 업로드 시간대 (예: 화·목 오후 6~9시)",\n  "titleTips": ["제목 팁1","제목 팁2","제목 팁3"],\n  "summary": "2~3문장 종합 전략 제안"\n}\n\n실제 트렌딩 데이터에 근거한 실용적인 조언을 한국어로 작성하세요.`;

  try {
    const raw = await callClaude(aiKey, prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답 형식 오류');

    const strategy = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ strategy });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 전략 생성 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
