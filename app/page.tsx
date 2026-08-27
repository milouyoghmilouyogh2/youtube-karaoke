"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractVideoId } from "@/lib/fetchSubtitles";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [lang, setLang] = useState("en");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      setError("Please enter a valid YouTube URL");
      return;
    }
    router.push(`/watch?v=${videoId}&lang=${lang}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          🎤 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">Karaoke</span> Subtitles
        </h1>
        <p className="text-white/50 text-lg md:text-xl max-w-lg mx-auto">
          Paste a YouTube video link and sing along with word-by-word karaoke subtitles
        </p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a YouTube URL here..."
              className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
            />
            <button type="submit" className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all active:scale-95 shadow-lg shadow-purple-500/25">
              Go 🎵
            </button>
          </div>
          <div className="flex items-center gap-4 px-2">
            <span className="text-white/40 text-sm">Language:</span>
            {[{ code: "en", label: "🇬🇧 English" }, { code: "fr", label: "🇫🇷 Français" }].map((option) => (
              <button key={option.code} type="button" onClick={() => setLang(option.code)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === option.code ? "bg-white/15 text-white border border-white/20" : "text-white/40 hover:text-white/60"}`}>
                {option.label}
              </button>
            ))}
          </div>
          {error && <div className="text-red-400 text-sm text-center bg-red-400/10 rounded-lg px-4 py-2">{error}</div>}
        </div>
      </form>
      <div className="mt-12 text-center">
        <p className="text-white/30 text-sm mb-3">Try it with:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/watch?v=kJQP7kiw5Fk", "https://www.youtube.com/watch?v=JGwWNGJdvx8"].map((example) => (
            <button key={example} onClick={() => setUrl(example)} className="text-xs text-white/20 hover:text-purple-400 transition-colors truncate max-w-[200px]">
              {example.replace("https://www.youtube.com/watch?v=", ".youtube.com/...")}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}