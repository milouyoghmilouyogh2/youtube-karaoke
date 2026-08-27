import { SubtitleLine, WordTiming } from "./types";

export function parseSRT(content: string): SubtitleLine[] {
  const blocks = content.trim().split(/\n\s*\n/);
  const lines: SubtitleLine[] = [];
  for (const block of blocks) {
    const parts = block.trim().split("\n");
    if (parts.length < 2) continue;
    const timeIndex = parts.findIndex((p) => p.includes("-->"));
    if (timeIndex === -1) continue;
    const timeLine = parts[timeIndex];
    const text = parts.slice(timeIndex + 1).join(" ").trim();
    if (!text) continue;
    const [startMs, endMs] = parseTimeRange(timeLine);
    if (startMs === null || endMs === null) continue;
    const words = textToWords(text, startMs, endMs);
    lines.push({ words, lineStart: startMs, lineEnd: endMs });
  }
  return lines;
}

export function parseVTT(content: string): SubtitleLine[] {
  const cleaned = content.replace(/^WEBVTT[^\n]*\n/i, "").trim();
  const withoutNotes = cleaned.replace(/NOTE[^\n]*\n[\s\S]*?\n\n/g, "");
  const withoutStyles = withoutNotes.replace(/STYLE[^\n]*\n[\s\S]*?\n\n/g, "");
  return parseSRT(withoutStyles);
}

export function parseSubtitleFile(content: string, filename?: string): SubtitleLine[] {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext === "vtt") return parseVTT(content);
  if (ext === "srt") return parseSRT(content);
  if (content.trimStart().startsWith("WEBVTT")) return parseVTT(content);
  return parseSRT(content);
}

function parseTime(timeStr: string): number | null {
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 3600000 + parseInt(match[2], 10) * 60000 + parseInt(match[3], 10) * 1000 + parseInt(match[4], 10);
}

function parseTimeRange(timeLine: string): [number | null, number | null] {
  const parts = timeLine.split("-->");
  if (parts.length !== 2) return [null, null];
  return [parseTime(parts[0]), parseTime(parts[1])];
}

function textToWords(text: string, startMs: number, endMs: number): WordTiming[] {
  const cleanText = text.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">" ).replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  const words = cleanText.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const durationPerWord = (endMs - startMs) / words.length;
  return words.map((word, i) => ({ text: word, start: startMs + i * durationPerWord, end: startMs + (i + 1) * durationPerWord }));
}