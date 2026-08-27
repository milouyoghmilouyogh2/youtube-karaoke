import { type NextRequest } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("videoId");
  const lang = searchParams.get("lang") || "en";
  const action = searchParams.get("action");

  if (!videoId) {
    return Response.json({ error: "videoId is required" }, { status: 400 });
  }

  const fetchWithRetry = async (vid: string, l: string, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await YoutubeTranscript.fetchTranscript(vid, { lang: l });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("too many") && i < retries - 1) {
          await new Promise((r) => setTimeout(r, delay * (i + 1)));
          continue;
        }
        throw err;
      }
    }
    return [];
  };

  try {
    if (action === "list") {
      const allTracks: { lang: string; name: string }[] = [];
      const seenLangs = new Set<string>();
      for (const tryLang of [lang, "en", "fr", "es", "de", "pt", "ja"]) {
        if (seenLangs.has(tryLang)) continue;
        try {
          const transcript = await fetchWithRetry(videoId, tryLang, 2, 1500);
          if (transcript.length > 0) {
            seenLangs.add(tryLang);
            allTracks.push({ lang: tryLang, name: getLanguageName(tryLang) });
          }
        } catch {}
      }
      return Response.json({ tracks: allTracks });
    }

    let transcript;
    try {
      transcript = await fetchWithRetry(videoId, lang);
    } catch {
      try {
        transcript = await fetchWithRetry(videoId, "en");
      } catch {
        return Response.json({ error: "No subtitles found for this video" }, { status: 404 });
      }
    }

    if (!transcript || transcript.length === 0) {
      return Response.json({ error: "No subtitle data found" }, { status: 404 });
    }

    const events = transcript.map((line) => ({
      tStartMs: line.offset,
      dDurationMs: line.duration,
      segs: [{ utf8: line.text }],
    }));

    return Response.json({ events });
  } catch (error) {
    console.error("Subtitle fetch error:", error);
    return Response.json({ error: "Internal error fetching subtitles" }, { status: 500 });
  }
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = { en: "English", fr: "Français", es: "Español", de: "Deutsch", pt: "Português", ja: "日本語", ko: "한국어", zh: "中文", it: "Italiano", ru: "Русский" };
  return names[code] || code;
}