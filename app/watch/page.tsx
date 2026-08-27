"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import KaraokeDisplay from "@/components/KaraokeDisplay";
import SubtitleEditor from "@/components/SubtitleEditor";
import { fetchSubtitles, fetchAvailableTracks } from "@/lib/fetchSubtitles";
import { SubtitleLine } from "@/lib/types";

export default function WatchPage({ searchParams }: { searchParams: Promise<{ v?: string; lang?: string }> }) {
  const params = use(searchParams);
  const videoId = params.v || "";
  const initialLang = params.lang || "en";
  const router = useRouter();
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableTracks, setAvailableTracks] = useState<{ lang: string; name: string }[]>([]);
  const [currentLang, setCurrentLang] = useState(initialLang);
  const [subtitlesLoaded, setSubtitlesLoaded] = useState(false);

  const loadTracks = useCallback(async () => {
    if (!videoId) return;
    const tracks = await fetchAvailableTracks(videoId);
    setAvailableTracks(tracks);
  }, [videoId]);

  const loadSubtitles = useCallback(async (lang: string) => {
    if (!videoId) return;
    setLoading(true);
    setError("");
    try {
      const lines = await fetchSubtitles(videoId, lang);
      setSubtitles(lines);
      setSubtitlesLoaded(true);
      setCurrentLang(lang);
    } catch {
      setError("");
      setSubtitlesLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  const handleVideoReady = useCallback(() => { loadTracks(); loadSubtitles(currentLang); }, [loadTracks, loadSubtitles, currentLang]);
  const handleTimeUpdate = useCallback((timeMs: number) => { setCurrentTimeMs(timeMs); }, []);
  const handleLangChange = useCallback((lang: string) => { setCurrentLang(lang); loadSubtitles(lang); }, [loadSubtitles]);
  const handleLinesChange = useCallback((newLines: SubtitleLine[]) => { setSubtitles(newLines); setSubtitlesLoaded(true); }, []);

  if (!videoId) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-lg mb-4">No video specified</p>
          <button onClick={() => router.push("/")} className="text-purple-400 hover:text-purple-300 underline">Go back home</button>
        </div>
      </main>
    );
  }

  const hasSubtitles = subtitles.length > 0;

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push("/")} className="text-white/40 hover:text-white transition-colors text-sm flex items-center gap-1">← Back</button>
      </div>
      <VideoPlayer videoId={videoId} onTimeUpdate={handleTimeUpdate} onReady={handleVideoReady} />
      {availableTracks.length > 1 && (
        <div className="flex items-center gap-3 mt-4">
          <span className="text-white/40 text-sm">Subtitles:</span>
          {availableTracks.map((track) => (
            <button key={track.lang} onClick={() => handleLangChange(track.lang)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${currentLang === track.lang ? "bg-purple-500/30 text-white border border-purple-400/30" : "text-white/40 hover:text-white/70 border border-transparent"}`}>
              {track.name}
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/50 text-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
            Loading subtitles...
          </div>
        </div>
      )}
      {!loading && subtitlesLoaded && !hasSubtitles && (
        <div className="text-center py-8">
          <p className="text-yellow-400/80 text-lg mb-2">⚠️ No automatic subtitles found</p>
          <p className="text-white/40 text-sm mb-4">This video may not have captions enabled.<br />You can upload your own subtitle file or paste them below!</p>
        </div>
      )}
      {!loading && hasSubtitles && (
        <div className="mt-6 flex-1">
          <KaraokeDisplay lines={subtitles} currentTimeMs={currentTimeMs} />
        </div>
      )}
      {!loading && !subtitlesLoaded && (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/30 text-lg">Waiting for video to load...</div>
        </div>
      )}
      <SubtitleEditor lines={subtitles} onLinesChange={handleLinesChange} currentTimeMs={currentTimeMs} />
    </main>
  );
}