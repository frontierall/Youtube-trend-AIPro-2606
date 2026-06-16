import { NextRequest, NextResponse } from 'next/server';

type InsightRequestVideo = {
  rank: number;
  id: string;
  title: string;
  channelTitle: string;
  categoryTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
  tags?: string[];
};

const ALLOWED_MODELS = new Set(['gpt-5.4-mini', 'gpt-5.4', 'gpt-5.5']);

const insightSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    topics: {
      type: 'array',
      items: { type: 'string' },
    },
    repeatedKeywords: {
      type: 'array',
      items: { type: 'string' },
    },
    risingCategories: {
      type: 'array',
      items: { type: 'string' },
    },
    contentIdeas: {
      type: 'array',
      items: { type: 'string' },
    },
    selectedVideoInsight: { type: 'string' },
  },
  required: ['summary', 'topics', 'repeatedKeywords', 'risingCategories', 'contentIdeas', 'selectedVideoInsight'],
};

function extractOutputText(data: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (data.output_text) return data.output_text;

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join('\n') ?? '';
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-openai-api-key');
  if (!apiKey) return NextResponse.json({ error: 'OpenAI API 키가 필요합니다.' }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    model?: string;
    language?: 'ko' | 'en';
    regionCode?: string;
    categoryTitle?: string;
    mode?: 'all' | 'selected';
    selectedVideoId?: string;
    videos?: InsightRequestVideo[];
  } | null;

  if (!body?.videos?.length) {
    return NextResponse.json({ error: '분석할 영상 목록이 필요합니다.' }, { status: 400 });
  }

  const model = body.model && ALLOWED_MODELS.has(body.model) ? body.model : 'gpt-5.4-mini';
  const videos = body.videos.slice(0, 100);
  const language = body.language === 'en' ? 'English' : 'Korean';
  const selectedVideo = body.selectedVideoId
    ? videos.find((video) => video.id === body.selectedVideoId)
    : undefined;

  const input = [
    {
      role: 'system',
      content:
        'You are a YouTube trend analyst. Analyze only the supplied video metadata. Do not invent external facts. Return concise, practical insights for content planning.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        instruction: `Respond in ${language}. Identify today's trending topics, repeated keywords, rising categories, and practical content planning hints.`,
        regionCode: body.regionCode,
        categoryTitle: body.categoryTitle || 'All categories',
        mode: body.mode ?? 'all',
        selectedVideo,
        videos,
      }),
    },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input,
        reasoning: { effort: model === 'gpt-5.4-mini' ? 'low' : 'medium' },
        max_output_tokens: 1800,
        text: {
          format: {
            type: 'json_schema',
            name: 'youtube_trend_insight',
            schema: insightSchema,
            strict: true,
          },
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || `OpenAI API 오류 ${response.status}` },
        { status: response.status }
      );
    }

    const text = extractOutputText(data);
    if (!text) return NextResponse.json({ error: 'AI 응답을 읽지 못했습니다.' }, { status: 502 });

    return NextResponse.json({ insight: JSON.parse(text), model });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 인사이트 생성 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
