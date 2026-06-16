import type { YouTubeVideo, YouTubeCommentThread, YouTubeChannel } from '@/types/youtube';
import { formatViewCount, formatDuration } from './formatters';

// ── CSV helpers ────────────────────────────────────────────────────────────────

function escapeCell(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadCSV(rows: (string | number | undefined)[][], filename: string) {
  const content = '﻿' + rows.map(r => r.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${today()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Video CSV ─────────────────────────────────────────────────────────────────

export function exportVideosToCSV(videos: YouTubeVideo[], reportTitle: string) {
  const header = ['순위', '제목', '채널', '조회수', '좋아요', '댓글수', '재생시간', '게시일', 'URL'];
  const rows = videos.map((v, i) => [
    i + 1,
    v.snippet.title,
    v.snippet.channelTitle,
    v.statistics.viewCount,
    v.statistics.likeCount || '0',
    v.statistics.commentCount || '0',
    formatDuration(v.contentDetails.duration),
    v.snippet.publishedAt.slice(0, 10),
    `https://youtube.com/watch?v=${v.id}`,
  ]);
  downloadCSV([header, ...rows], reportTitle);
}

// ── Comments CSV ──────────────────────────────────────────────────────────────

export function exportCommentsToCSV(comments: YouTubeCommentThread[], label: string) {
  const header = ['순위', '작성자', '댓글', '좋아요', '답글수', '작성일'];
  const rows = comments.map((t, i) => {
    const s = t.snippet.topLevelComment.snippet;
    return [
      i + 1,
      s.authorDisplayName,
      s.textDisplay.replace(/<[^>]+>/g, ''),
      s.likeCount,
      t.snippet.totalReplyCount,
      s.publishedAt.slice(0, 10),
    ];
  });
  downloadCSV([header, ...rows], `댓글_${label.slice(0, 20)}`);
}

// ── Keyword CSV ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  '은', '는', '이', '가', '을', '를', '의', '으로', '와', '과', '에', '에서', '도', '만', '한', '대',
  '더', '그', '저', '것', '수', '할', '하는', '있는', '없는', '있다', '없다',
  'the', 'a', 'an', 'in', 'of', 'to', 'and', 'or', 'for', 'with', 'on', 'at', 'by',
  'is', 'it', 'this', 'that', 'be', 'have', 'from', 'not', 'are', 'was', 'were',
]);

export function extractKeywords(videos: YouTubeVideo[]): { word: string; count: number }[] {
  const freq: Record<string, number> = {};

  for (const v of videos) {
    const words = v.snippet.title
      .split(/[\s|,\-\[\]()#!?~.·\\/+:]+/)
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

    for (const word of words) freq[word] = (freq[word] || 0) + 1;

    if (v.snippet.tags) {
      for (const tag of v.snippet.tags) {
        const t = tag.toLowerCase().trim();
        if (t.length > 1 && !STOP_WORDS.has(t)) freq[t] = (freq[t] || 0) + 1;
      }
    }
  }

  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .filter(({ count }) => count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
}

export function exportKeywordsToCSV(videos: YouTubeVideo[], label: string) {
  const keywords = extractKeywords(videos);
  const header = ['순위', '키워드', '출현 횟수'];
  const rows = keywords.map((k, i) => [i + 1, k.word, k.count]);
  downloadCSV([header, ...rows], `키워드_${label}`);
}

// ── Data Analysis CSV exports ─────────────────────────────────────────────────

function parseDurSec(dur: string): number {
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] || '0') * 3600 + parseInt(m[2] || '0') * 60 + parseInt(m[3] || '0');
}

function daysDiff(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export function exportSnapshotToCSV(videos: YouTubeVideo[], eduVideos: YouTubeVideo[], regionCode: string) {
  const toNum = (s?: string) => parseInt(s || '0') || 0;
  const viewArr = videos.map(v => toNum(v.statistics.viewCount));
  const totalViews = viewArr.reduce((a, b) => a + b, 0);
  const avgViews = videos.length ? totalViews / videos.length : 0;
  const likeRates = videos.map((v, i) => viewArr[i] ? toNum(v.statistics.likeCount) / viewArr[i] * 100 : 0);
  const avgLikeRate = likeRates.length ? likeRates.reduce((a, b) => a + b, 0) / likeRates.length : 0;
  const commentRates = videos.map((v, i) => viewArr[i] ? toNum(v.statistics.commentCount) / viewArr[i] * 100 : 0);
  const avgCommentRate = commentRates.length ? commentRates.reduce((a, b) => a + b, 0) / commentRates.length : 0;

  const eduViewArr = eduVideos.map(v => toNum(v.statistics.viewCount));
  const eduAvgViews = eduViewArr.length ? eduViewArr.reduce((a, b) => a + b, 0) / eduViewArr.length : 0;
  const eduLikeRates = eduVideos.map((v, i) => eduViewArr[i] ? toNum(v.statistics.likeCount) / eduViewArr[i] * 100 : 0);
  const eduAvgLikeRate = eduLikeRates.length ? eduLikeRates.reduce((a, b) => a + b, 0) / eduLikeRates.length : 0;

  const buckets: [string, number][] = [
    ['1억 이상',     viewArr.filter(v => v >= 100_000_000).length],
    ['1000만~1억',   viewArr.filter(v => v >= 10_000_000 && v < 100_000_000).length],
    ['100만~1000만', viewArr.filter(v => v >= 1_000_000 && v < 10_000_000).length],
    ['10만~100만',   viewArr.filter(v => v >= 100_000 && v < 1_000_000).length],
    ['10만 미만',    viewArr.filter(v => v < 100_000).length],
  ];

  const rows = [
    ['[KPI 요약]', '', ''],
    ['지표', '전체 트렌딩', '교육 TOP30'],
    ['영상 수', videos.length, eduVideos.length],
    ['총 조회수 합계', totalViews, eduViewArr.reduce((a, b) => a + b, 0)],
    ['평균 조회수', Math.round(avgViews), Math.round(eduAvgViews)],
    ['평균 좋아요율(%)', avgLikeRate.toFixed(2), eduAvgLikeRate.toFixed(2)],
    ['평균 댓글율(%)', avgCommentRate.toFixed(3), ''],
    [],
    ['[조회수 구간 분포]'],
    ['조회수 구간', '영상 수', '비율(%)'],
    ...buckets.map(([l, c]) => [l, c, videos.length ? Math.round(c / videos.length * 100) : 0]),
  ];
  downloadCSV(rows, `트렌드스냅샷_${regionCode}`);
}

export function exportEngagementToCSV(videos: YouTubeVideo[], regionCode: string) {
  const toNum = (s?: string) => parseInt(s || '0') || 0;
  const withRates = videos.map(v => {
    const views = toNum(v.statistics.viewCount);
    return {
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      views,
      likes: toNum(v.statistics.likeCount),
      comments: toNum(v.statistics.commentCount),
      likeRate: views ? toNum(v.statistics.likeCount) / views * 100 : 0,
      commentRate: views ? toNum(v.statistics.commentCount) / views * 100 : 0,
    };
  }).sort((a, b) => b.likeRate - a.likeRate);

  const rows = [
    ['순위', '제목', '채널', '조회수', '좋아요율(%)', '댓글율(%)'],
    ...withRates.map((r, i) => [i + 1, r.title, r.channel, r.views, r.likeRate.toFixed(2), r.commentRate.toFixed(3)]),
  ];
  downloadCSV(rows, `참여도분석_${regionCode}`);
}

export function exportChannelPatternToCSV(videos: YouTubeVideo[], regionCode: string) {
  const toNum = (s?: string) => parseInt(s || '0') || 0;
  const channelMap: Record<string, { title: string; count: number; totalViews: number }> = {};
  for (const v of videos) {
    const id = v.snippet.channelId;
    if (!channelMap[id]) channelMap[id] = { title: v.snippet.channelTitle, count: 0, totalViews: 0 };
    channelMap[id].count++;
    channelMap[id].totalViews += toNum(v.statistics.viewCount);
  }
  const channels = Object.values(channelMap).sort((a, b) => b.count - a.count);

  const durLabels = ['쇼츠 (1분 미만)', '단편 (1~5분)', '중편 (5~10분)', '장편 (10~20분)', '초장편 (20분+)'];
  const durCounts = [0, 0, 0, 0, 0];
  for (const v of videos) {
    const s = parseDurSec(v.contentDetails.duration);
    if (s < 60) durCounts[0]++;
    else if (s < 300) durCounts[1]++;
    else if (s < 600) durCounts[2]++;
    else if (s < 1200) durCounts[3]++;
    else durCounts[4]++;
  }

  const ageLabels = ['오늘 (24시간 내)', '2~7일', '8~30일', '1~6개월', '6개월 이상'];
  const ageCounts = [0, 0, 0, 0, 0];
  for (const v of videos) {
    const d = daysDiff(v.snippet.publishedAt);
    if (d < 1) ageCounts[0]++;
    else if (d <= 7) ageCounts[1]++;
    else if (d <= 30) ageCounts[2]++;
    else if (d <= 180) ageCounts[3]++;
    else ageCounts[4]++;
  }

  const rows = [
    ['[채널 순위]'],
    ['순위', '채널명', '트렌딩 영상 수', '총 조회수'],
    ...channels.map((c, i) => [i + 1, c.title, c.count, c.totalViews]),
    [],
    ['[영상 길이 분포]'],
    ['영상 길이 구간', '영상 수', '비율(%)'],
    ...durLabels.map((l, i) => [l, durCounts[i], videos.length ? Math.round(durCounts[i] / videos.length * 100) : 0]),
    [],
    ['[업로드 시점 분포]'],
    ['업로드 시점 구간', '영상 수', '비율(%)'],
    ...ageLabels.map((l, i) => [l, ageCounts[i], videos.length ? Math.round(ageCounts[i] / videos.length * 100) : 0]),
  ];
  downloadCSV(rows, `콘텐츠패턴_${regionCode}`);
}

// ── Data Analysis PDF ─────────────────────────────────────────────────────────

export function printDataAnalysisReport(videos: YouTubeVideo[], eduVideos: YouTubeVideo[], regionCode: string) {
  const toNum = (s?: string) => parseInt(s || '0') || 0;
  const viewArr = videos.map(v => toNum(v.statistics.viewCount));
  const totalViews = viewArr.reduce((a, b) => a + b, 0);
  const avgViews = videos.length ? totalViews / videos.length : 0;
  const likeRates = videos.map((v, i) => viewArr[i] ? toNum(v.statistics.likeCount) / viewArr[i] * 100 : 0);
  const avgLikeRate = likeRates.length ? likeRates.reduce((a, b) => a + b, 0) / likeRates.length : 0;
  const commentRates = videos.map((v, i) => viewArr[i] ? toNum(v.statistics.commentCount) / viewArr[i] * 100 : 0);
  const avgCommentRate = commentRates.length ? commentRates.reduce((a, b) => a + b, 0) / commentRates.length : 0;

  const eduViewArr = eduVideos.map(v => toNum(v.statistics.viewCount));
  const eduAvgViews = eduViewArr.length ? eduViewArr.reduce((a, b) => a + b, 0) / eduViewArr.length : 0;
  const eduLikeRates = eduVideos.map((v, i) => eduViewArr[i] ? toNum(v.statistics.likeCount) / eduViewArr[i] * 100 : 0);
  const eduAvgLikeRate = eduLikeRates.length ? eduLikeRates.reduce((a, b) => a + b, 0) / eduLikeRates.length : 0;

  const viewBuckets = [
    ['1억 이상',     viewArr.filter(v => v >= 100_000_000).length],
    ['1000만~1억',   viewArr.filter(v => v >= 10_000_000 && v < 100_000_000).length],
    ['100만~1000만', viewArr.filter(v => v >= 1_000_000 && v < 10_000_000).length],
    ['10만~100만',   viewArr.filter(v => v >= 100_000 && v < 1_000_000).length],
    ['10만 미만',    viewArr.filter(v => v < 100_000).length],
  ] as [string, number][];

  const top5Engagement = [...videos]
    .map((v, i) => ({ v, likeRate: likeRates[i], commentRate: commentRates[i] }))
    .sort((a, b) => b.likeRate - a.likeRate)
    .slice(0, 5);

  const channelMap: Record<string, { title: string; count: number; totalViews: number }> = {};
  for (const v of videos) {
    const id = v.snippet.channelId;
    if (!channelMap[id]) channelMap[id] = { title: v.snippet.channelTitle, count: 0, totalViews: 0 };
    channelMap[id].count++;
    channelMap[id].totalViews += toNum(v.statistics.viewCount);
  }
  const topChannels = Object.values(channelMap).sort((a, b) => b.count - a.count).slice(0, 8);

  const durLabels = ['쇼츠 (<1분)', '단편 (1~5분)', '중편 (5~10분)', '장편 (10~20분)', '초장편 (20분+)'];
  const durCounts = [0, 0, 0, 0, 0];
  for (const v of videos) {
    const s = parseDurSec(v.contentDetails.duration);
    if (s < 60) durCounts[0]++;
    else if (s < 300) durCounts[1]++;
    else if (s < 600) durCounts[2]++;
    else if (s < 1200) durCounts[3]++;
    else durCounts[4]++;
  }

  const keywords = extractKeywords(videos).slice(0, 20);

  const fmtNum = (n: number) => Math.round(n).toLocaleString('ko-KR');

  const kpiGrid = `
    <div class="stat-grid">
      <div class="stat-box"><div class="stat-label">분석 영상 수</div><div class="stat-value">${videos.length}개</div></div>
      <div class="stat-box"><div class="stat-label">총 조회수 합계</div><div class="stat-value">${formatViewCount(String(Math.round(totalViews)))}</div></div>
      <div class="stat-box"><div class="stat-label">평균 조회수</div><div class="stat-value">${formatViewCount(String(Math.round(avgViews)))}</div></div>
      <div class="stat-box"><div class="stat-label">평균 좋아요율</div><div class="stat-value" style="color:#ef4444">${avgLikeRate.toFixed(2)}%</div></div>
    </div>`;

  const bucketRows = viewBuckets.map(([label, count]) =>
    `<tr><td>${label}</td><td style="text-align:right">${count}</td><td style="text-align:right">${videos.length ? Math.round(count / videos.length * 100) : 0}%</td></tr>`
  ).join('');

  const eduRow = eduVideos.length
    ? `<tr><td>📚 교육 TOP30</td><td style="text-align:right">${eduVideos.length}개</td><td style="text-align:right">${formatViewCount(String(Math.round(eduAvgViews)))}</td><td style="text-align:right;color:#ef4444">${eduAvgLikeRate.toFixed(2)}%</td></tr>`
    : '';

  const top5Rows = top5Engagement.map(({ v, likeRate, commentRate }, i) =>
    `<tr><td>${i + 1}</td><td>${v.snippet.title.slice(0, 45)}${v.snippet.title.length > 45 ? '…' : ''}</td><td>${v.snippet.channelTitle}</td><td style="text-align:right;color:#ef4444">${likeRate.toFixed(2)}%</td><td style="text-align:right">${commentRate.toFixed(3)}%</td></tr>`
  ).join('');

  const channelRows = topChannels.map((c, i) =>
    `<tr><td>${i + 1}</td><td>${c.title}</td><td style="text-align:right">${c.count}</td><td style="text-align:right">${formatViewCount(String(c.totalViews))}</td></tr>`
  ).join('');

  const durRows = durLabels.map((l, i) =>
    `<tr><td>${l}</td><td style="text-align:right">${durCounts[i]}</td><td style="text-align:right">${videos.length ? Math.round(durCounts[i] / videos.length * 100) : 0}%</td></tr>`
  ).join('');

  const keywordTags = keywords.map((k, i) =>
    `<span class="kw-tag ${i < 3 ? 'kw-top' : ''}">${k.word} <em>${k.count}</em></span>`
  ).join('');

  const body = `
    <style>
      .section { margin-top: 20px; }
      .section h2 { font-size: 13px; font-weight: 700; color: #374151; margin: 0 0 8px; padding-left: 8px; border-left: 3px solid #ef4444; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .kw-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .kw-tag { display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 11px; color: #374151; }
      .kw-tag em { font-style: normal; opacity: 0.5; font-size: 10px; }
      .kw-top { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
    </style>

    ${kpiGrid}

    <div class="two-col">
      <div class="section">
        <h2>조회수 구간 분포</h2>
        <table><thead><tr><th>구간</th><th>영상 수</th><th>비율</th></tr></thead>
        <tbody>${bucketRows}</tbody></table>
      </div>
      <div class="section">
        <h2>교육 vs 전체 비교</h2>
        <table><thead><tr><th>구분</th><th>영상 수</th><th>평균 조회수</th><th>좋아요율</th></tr></thead>
        <tbody>
          <tr><td>전체 트렌딩</td><td style="text-align:right">${videos.length}개</td><td style="text-align:right">${formatViewCount(String(Math.round(avgViews)))}</td><td style="text-align:right;color:#ef4444">${avgLikeRate.toFixed(2)}%</td></tr>
          ${eduRow}
        </tbody></table>
        <table style="margin-top:8px"><thead><tr><th>지표</th><th>수치</th></tr></thead>
        <tbody>
          <tr><td>평균 댓글율</td><td style="text-align:right">${avgCommentRate.toFixed(3)}%</td></tr>
        </tbody></table>
      </div>
    </div>

    <div class="section">
      <h2>참여도 TOP 5 영상 (좋아요율 기준)</h2>
      <table><thead><tr><th>#</th><th>제목</th><th>채널</th><th>좋아요율</th><th>댓글율</th></tr></thead>
      <tbody>${top5Rows}</tbody></table>
    </div>

    <div class="two-col">
      <div class="section">
        <h2>인기 채널 TOP 8</h2>
        <table><thead><tr><th>#</th><th>채널명</th><th>영상 수</th><th>총 조회수</th></tr></thead>
        <tbody>${channelRows}</tbody></table>
      </div>
      <div class="section">
        <h2>영상 길이 분포</h2>
        <table><thead><tr><th>길이 구간</th><th>영상 수</th><th>비율</th></tr></thead>
        <tbody>${durRows}</tbody></table>
      </div>
    </div>

    <div class="section">
      <h2>인기 키워드 TOP ${keywords.length}</h2>
      <div class="kw-wrap">${keywordTags}</div>
    </div>`;

  openPrint(`데이터 분석 통합 리포트 · ${regionCode}`, `트렌딩 ${videos.length}개 영상 기반`, body);
}

// ── Print / PDF helpers ───────────────────────────────────────────────────────

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕',sans-serif;
    margin: 0; padding: 24px; color: #1f2937; font-size: 13px; line-height: 1.5;
  }
  h1 { font-size: 22px; color: #ef4444; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #6b7280; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th {
    background: #ef4444; color: white;
    padding: 7px 9px; text-align: left; font-size: 11px;
  }
  td { border-bottom: 1px solid #e5e7eb; padding: 6px 9px; vertical-align: top; font-size: 11px; }
  tr:nth-child(even) td { background: #fef2f2; }
  .rank {
    display: inline-block; background: #ef4444; color: white;
    border-radius: 4px; padding: 1px 5px; font-weight: 700; font-size: 10px;
  }
  a { color: #ef4444; text-decoration: none; }
  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin: 12px 0 20px; }
  .stat-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; text-align: center; }
  .stat-label { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
  .stat-value { font-size: 15px; font-weight: 700; color: #111827; }
  .toolbar { margin-bottom: 16px; display: flex; gap: 8px; }
  .btn-print { background:#ef4444; color:white; border:none; padding:8px 18px; border-radius:7px; cursor:pointer; font-size:13px; font-family:inherit; }
  .btn-close { background:#f3f4f6; color:#374151; border:none; padding:8px 18px; border-radius:7px; cursor:pointer; font-size:13px; font-family:inherit; }
  @page { margin: 1.5cm; size: A4 landscape; }
  @media print { .toolbar { display: none; } }
`;

function openPrint(title: string, subtitle: string, body: string) {
  const w = window.open('', '_blank', 'width=1120,height=820');
  if (!w) {
    alert('팝업이 차단되었습니다. 브라우저에서 팝업을 허용 후 다시 시도해주세요.');
    return;
  }
  const created = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  w.document.write(`<!DOCTYPE html><html lang="ko"><head>
    <meta charset="UTF-8"><title>${title}</title>
    <style>${PRINT_CSS}</style>
  </head><body>
    <div class="toolbar">
      <button class="btn-print" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>
      <button class="btn-close" onclick="window.close()">닫기</button>
    </div>
    <h1>${title}</h1>
    <p class="sub">${subtitle ? subtitle + ' · ' : ''}생성일: ${created}</p>
    ${body}
  </body></html>`);
  w.document.close();
}

// ── Video Report PDF ──────────────────────────────────────────────────────────

export function printVideoReport(videos: YouTubeVideo[], title: string, subtitle: string) {
  const rows = videos.map((v, i) => `
    <tr>
      <td><span class="rank">${i + 1}</span></td>
      <td><a href="https://youtube.com/watch?v=${v.id}" target="_blank">${v.snippet.title}</a></td>
      <td>${v.snippet.channelTitle}</td>
      <td style="text-align:right">${formatViewCount(v.statistics.viewCount)}</td>
      <td style="text-align:right">${v.statistics.likeCount ? formatViewCount(v.statistics.likeCount) : '-'}</td>
      <td style="text-align:right">${v.statistics.commentCount ? formatViewCount(v.statistics.commentCount) : '-'}</td>
      <td>${formatDuration(v.contentDetails.duration)}</td>
      <td>${v.snippet.publishedAt.slice(0, 10)}</td>
    </tr>
  `).join('');

  const body = `
    <table>
      <thead><tr>
        <th>#</th><th>제목</th><th>채널</th>
        <th>조회수</th><th>좋아요</th><th>댓글</th>
        <th>재생시간</th><th>게시일</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  openPrint(title, subtitle, body);
}

// ── Channel Report PDF ────────────────────────────────────────────────────────

export function printChannelReport(channel: YouTubeChannel, videos: YouTubeVideo[]) {
  const sub = channel.statistics.hiddenSubscriberCount
    ? '-'
    : formatViewCount(channel.statistics.subscriberCount);

  const statsGrid = `
    <div class="stat-grid">
      <div class="stat-box"><div class="stat-label">구독자</div><div class="stat-value">${sub}</div></div>
      <div class="stat-box"><div class="stat-label">총 조회수</div><div class="stat-value">${formatViewCount(channel.statistics.viewCount)}</div></div>
      <div class="stat-box"><div class="stat-label">동영상 수</div><div class="stat-value">${parseInt(channel.statistics.videoCount).toLocaleString()}개</div></div>
      <div class="stat-box"><div class="stat-label">채널 개설</div><div class="stat-value">${new Date(channel.snippet.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}</div></div>
    </div>`;

  const videoRows = videos.map((v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><a href="https://youtube.com/watch?v=${v.id}" target="_blank">${v.snippet.title}</a></td>
      <td style="text-align:right">${v.statistics?.viewCount ? formatViewCount(v.statistics.viewCount) : '-'}</td>
      <td style="text-align:right">${v.statistics?.likeCount ? formatViewCount(v.statistics.likeCount) : '-'}</td>
      <td>${formatDuration(v.contentDetails.duration)}</td>
      <td>${v.snippet.publishedAt.slice(0, 10)}</td>
    </tr>`).join('');

  const videoTable = videos.length > 0 ? `
    <h2 style="font-size:15px;margin:24px 0 8px;color:#374151;">최근 업로드 영상</h2>
    <table>
      <thead><tr><th>#</th><th>제목</th><th>조회수</th><th>좋아요</th><th>재생시간</th><th>게시일</th></tr></thead>
      <tbody>${videoRows}</tbody>
    </table>` : '';

  const desc = channel.snippet.description
    ? `<p style="font-size:12px;color:#6b7280;margin:8px 0 16px;max-width:700px;line-height:1.6;">${channel.snippet.description.slice(0, 300)}${channel.snippet.description.length > 300 ? '…' : ''}</p>`
    : '';

  const body = `
    <h2 style="font-size:17px;margin:0 0 2px;">${channel.snippet.title}</h2>
    ${channel.snippet.customUrl ? `<p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">${channel.snippet.customUrl}</p>` : ''}
    ${desc}
    ${statsGrid}
    ${videoTable}`;

  openPrint(`채널 분석 · ${channel.snippet.title}`, channel.snippet.customUrl || '', body);
}

// ── Comments Report PDF ───────────────────────────────────────────────────────

export function printCommentsReport(comments: YouTubeCommentThread[], videoTitle: string) {
  const rows = comments.map((t, i) => {
    const s = t.snippet.topLevelComment.snippet;
    const text = s.textDisplay.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
    return `
      <tr>
        <td>${i + 1}</td>
        <td style="white-space:nowrap">${s.authorDisplayName}</td>
        <td>${text}</td>
        <td style="text-align:right">${s.likeCount > 0 ? s.likeCount.toLocaleString() : '-'}</td>
        <td style="text-align:right">${t.snippet.totalReplyCount > 0 ? t.snippet.totalReplyCount : '-'}</td>
        <td style="white-space:nowrap">${s.publishedAt.slice(0, 10)}</td>
      </tr>`;
  }).join('');

  const body = `
    <table>
      <thead><tr>
        <th>#</th><th>작성자</th><th>댓글</th>
        <th>좋아요</th><th>답글</th><th>작성일</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  openPrint(`댓글 분석`, videoTitle, body);
}
