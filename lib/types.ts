export interface WordTiming {
  text: string;
  start: number;
  end: number;
}

export interface SubtitleLine {
  words: WordTiming[];
  lineStart: number;
  lineEnd: number;
}

export interface SubtitleTrack {
  language: string;
  languageName: string;
  lines: SubtitleLine[];
}