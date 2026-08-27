"use client";

import { WordTiming } from "@/lib/types";

interface SubtitleLineProps {
  words: WordTiming[];
  currentTimeMs: number;
  isActive: boolean;
  isPast: boolean;
}

export default function SubtitleLine({ words, currentTimeMs, isActive, isPast }: SubtitleLineProps) {
  return (
    <div className="py-3 px-4 text-center">
      <span className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-relaxed tracking-wide">
        {words.map((word, i) => {
          let className = "karaoke-word ";
          if (isPast) { className += "karaoke-word-past"; }
          else if (isActive && currentTimeMs >= word.start) { className += "karaoke-word-active"; }
          else { className += "karaoke-word-dim"; }
          return <span key={i} className={className}>{word.text} </span>;
        })}
      </span>
    </div>
  );
}