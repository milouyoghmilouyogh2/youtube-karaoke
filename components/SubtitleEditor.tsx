"use client";

import { useState, useRef, useCallback } from "react";
import { SubtitleLine } from "@/lib/types";
import { parseSubtitleFile } from "@/lib/parseSrt";

interface SubtitleEditorProps {
  lines: SubtitleLine[];
  onLinesChange: (lines: SubtitleLine[]) => void;
  currentTimeMs: number;
}

export default function SubtitleEditor({ lines, onLinesChange, currentTimeMs }: SubtitleEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "paste" | "edit">("upload");
  const [pasteText, setPasteText] = useState("");
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [editingWord, setEditingWord] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseSubtitleFile(content, file.name);
      if (parsed.length > 0) { onLinesChange(parsed); setActiveTab("edit"); }
    };
    reader.readAsText(file);
  }, [onLinesChange]);

  const handlePasteImport = useCallback(() => {
    if (!pasteText.trim()) return;
    const parsed = parseSubtitleFile(pasteText);
    if (parsed.length > 0) { onLinesChange(parsed); setPasteText(""); setActiveTab("edit"); }
  }, [pasteText, onLinesChange]);

  const handleWordEdit = useCallback((lineIdx: number, wordIdx: number, newText: string) => {
    const updated = lines.map((line, li) => {
      if (li !== lineIdx) return line;
      return { ...line, words: line.words.map((w, wi) => wi === wordIdx ? { ...w, text: newText } : w) };
    });
    onLinesChange(updated);
  }, [lines, onLinesChange]);

  const handleWordDelete = useCallback((lineIdx: number, wordIdx: number) => {
    const updated = lines.map((line, li) => {
      if (li !== lineIdx) return line;
      const newWords = line.words.filter((_, wi) => wi !== wordIdx);
      return newWords.length === 0 ? null : { ...line, words: newWords };
    }).filter(Boolean) as SubtitleLine[];
    onLinesChange(updated);
  }, [lines, onLinesChange]);

  const handleLineDelete = useCallback((lineIdx: number) => {
    onLinesChange(lines.filter((_, li) => li !== lineIdx));
  }, [lines, onLinesChange]);

  const handleLineInsert = useCallback((afterIdx: number) => {
    const prevEnd = afterIdx >= 0 ? lines[afterIdx]?.lineEnd || 0 : 0;
    const nextStart = afterIdx < lines.length - 1 ? lines[afterIdx + 1]?.lineStart || prevEnd + 3000 : prevEnd + 3000;
    const newLine: SubtitleLine = { words: [{ text: "New subtitle", start: prevEnd, end: nextStart }], lineStart: prevEnd, lineEnd: nextStart };
    const updated = [...lines];
    updated.splice(afterIdx + 1, 0, newLine);
    onLinesChange(updated);
  }, [lines, onLinesChange]);

  if (!isOpen) {
    return <button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/70 hover:text-white text-sm transition-all z-50">✏️ Subtitle Editor</button>;
  }

  const currentLineIdx = lines.findIndex((l) => currentTimeMs >= l.lineStart && currentTimeMs <= l.lineEnd);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 z-50 max-h-[60vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-medium text-sm">✏️ Subtitle Editor</h3>
          <span className="text-white/30 text-xs">{lines.length} lines</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white text-lg">✕</button>
      </div>
      <div className="flex border-b border-white/10">
        {(["upload", "paste", "edit"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === tab ? "text-white border-b-2 border-purple-400" : "text-white/40 hover:text-white/60"}`}>
            {tab === "upload" && "📁 Upload SRT/VTT"}
            {tab === "paste" && "📋 Paste Subtitles"}
            {tab === "edit" && "✏️ Edit Words"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "upload" && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-white/30 text-center"><p className="text-lg mb-2">Upload a subtitle file</p><p className="text-sm">Supports SRT and VTT formats</p></div>
            <input ref={fileInputRef} type="file" accept=".srt,.vtt" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-300 transition-all">Choose File</button>
          </div>
        )}
        {activeTab === "paste" && (
          <div className="flex flex-col gap-3 h-full">
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={`Paste SRT or VTT content here...\n\nExample:\n1\n00:00:01,000 --> 00:00:04,000\nHello world`} className="flex-1 min-h-[200px] p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:border-purple-400/50" />
            <button onClick={handlePasteImport} disabled={!pasteText.trim()} className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Import Subtitles</button>
          </div>
        )}
        {activeTab === "edit" && (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              {lines.map((line, lineIdx) => (
                <div key={lineIdx} className={`p-3 rounded-lg border transition-all ${lineIdx === currentLineIdx ? "bg-purple-500/10 border-purple-400/30" : "bg-white/5 border-white/10"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/30 text-xs font-mono">{formatTime(line.lineStart)} → {formatTime(line.lineEnd)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleLineInsert(lineIdx)} className="text-xs text-white/20 hover:text-green-400 px-1" title="Insert line after">+</button>
                      <button onClick={() => handleLineDelete(lineIdx)} className="text-xs text-white/20 hover:text-red-400 px-1" title="Delete line">✕</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {line.words.map((word, wordIdx) => (
                      <span key={wordIdx} onClick={() => { setEditingLine(lineIdx); setEditingWord(wordIdx); setEditValue(word.text); }} className="cursor-pointer px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-all">
                        {editingLine === lineIdx && editingWord === wordIdx ? (
                          <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => { handleWordEdit(lineIdx, wordIdx, editValue); setEditingLine(null); setEditingWord(null); }} onKeyDown={(e) => { if (e.key === "Enter") { handleWordEdit(lineIdx, wordIdx, editValue); setEditingLine(null); setEditingWord(null); } if (e.key === "Escape") { setEditingLine(null); setEditingWord(null); } }} className="bg-transparent border-b border-purple-400 outline-none text-white text-sm w-20" />
                        ) : (word.text)}
                        <button onClick={(e) => { e.stopPropagation(); handleWordDelete(lineIdx, wordIdx); }} className="ml-1 text-white/20 hover:text-red-400 text-xs">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {lines.length === 0 && <div className="text-center text-white/30 py-8"><p>No subtitles loaded.</p><p className="text-sm mt-1">Upload an SRT/VTT file or paste subtitles to get started.</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(2, "0")}`;
}