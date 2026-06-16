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
