import { SubtitleLine, WordTiming } from "./types";

export function extractVideoId(url: string): string | null {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/, /^([a-zA-Z0-9_-]{11})$/];
  for (const pattern of patterns) { const match = url.match(pattern); if (match) return match[1]; }
  return null;
}

export async function fetchAvailableTracks(videoId: string): Promise<{ lang: string; name: string }[]> {
  try {
    const res = await fetch(`/api/subtitles?videoId=${videoId}&action=list`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.tracks || [];
  } catch { return []; }
}

export async function fetchSubtitles(videoId: string, lang: string = "en"): Promise<SubtitleLine[]> {
  try {
    const res = await fetch(`/api/subtitles?videoId=${videoId}&lang=${lang}`);
    if (!res.ok) { throw new Error(`Failed to fetch subtitles: ${res.status}`); }
    const data = await res.json();
    return parseSubtitleData(data);
  } catch (error) { console.error("Error fetching subtitles:", error); throw error; }
}

function parseSubtitleData(data: { events?: unknown[] }): SubtitleLine[] {
  if (!data.events) return [];
  const lines: SubtitleLine[] = [];
  for (const event of data.events) {
    const e = event as Record<string, unknown>;
    if (!e.segMs || !e.segs) continue;
    const segs = e.segs as { utf8?: string; tOffsetMs?: number }[];
    const startTimeMs = e.tStartMs as number;
    const words: WordTiming[] = [];
    let accumulatedOffset = 0;
    for (const seg of segs) {
      const text = seg.utf8;
      if (!text || text.trim() === "" || text === "\n") continue;
      const wordStart = startTimeMs + accumulatedOffset;
      const wordDuration = Math.max(text.trim().length * 80, 200);
      words.push({ text: text.trim(), start: wordStart, end: wordStart + wordDuration });
      accumulatedOffset += wordDuration;
    }
    if (words.length > 0) {
      const totalDuration = e.dDurationMs as number;
      lines.push({ words, lineStart: startTimeMs, lineEnd: startTimeMs + (totalDuration || accumulatedOffset) });
    }
  }
  return lines.map((line) => interpolateWordTimings(line));
}

function interpolateWordTimings(line: SubtitleLine): SubtitleLine {
  if (line.words.length <= 1) return line;
  const totalChars = line.words.reduce((sum, w) => sum + w.text.length, 0);
  const lineDuration = line.lineEnd - line.lineStart;
  let currentOffset = 0;
  const adjustedWords = line.words.map((word) => {
    const charFraction = word.text.length / totalChars;
    const duration = lineDuration * charFraction;
    const start = line.lineStart + currentOffset;
    const end = start + duration;
    currentOffset += duration;
    return { ...word, start, end };
  });
  return { ...line, words: adjustedWords };
}