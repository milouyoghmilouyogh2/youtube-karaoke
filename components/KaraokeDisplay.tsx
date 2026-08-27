"use client";

import { useRef, useEffect, useMemo } from "react";
import { SubtitleLine as SubtitleLineType } from "@/lib/types";
import SubtitleLine from "./SubtitleLine";

interface KaraokeDisplayProps {
  lines: SubtitleLineType[];
  currentTimeMs: number;
}

export default function KaraokeDisplay({ lines, currentTimeMs }: KaraokeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const activeLineIndex = useMemo(() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTimeMs >= lines[i].lineStart - 200) { return i; }
    }
    return -1;
  }, [lines, currentTimeMs]);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeLineRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const offset = (elementRect.top + elementRect.height / 2) - (containerRect.top + containerRect.height / 2);
      container.scrollTo({ top: container.scrollTop + offset, behavior: "smooth" });
    }
  }, [activeLineIndex]);

  if (lines.length === 0) {
    return <div className="flex items-center justify-center h-64 text-white/30 text-lg">No subtitles available</div>;
  }

  return (
    <div ref={containerRef} className="subtitle-scroll overflow-y-auto max-h-[50vh] md:max-h-[60vh] rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
      <div className="h-32" />
      {lines.map((line, index) => {
        const isActive = index === activeLineIndex;
        const isPast = index < activeLineIndex;
        return (
          <div key={index} ref={isActive ? activeLineRef : undefined}>
            <SubtitleLine words={line.words} currentTimeMs={currentTimeMs} isActive={isActive} isPast={isPast} />
          </div>
        );
      })}
      <div className="h-32" />
    </div>
  );
}