"use client";

import { useEffect, useRef, useCallback, useState } from "react";

declare global {
  interface Window {
    YT: {
      Player: new (element: HTMLElement, config: YouTubePlayerConfig) => YouTubePlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number; CUED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerConfig {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: { onReady?: (event: { target: YouTubePlayer }) => void; onStateChange?: (event: { target: YouTubePlayer; data: number }) => void };
}

interface YouTubePlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getPlaybackRate: () => number;
  setPlaybackRate: (rate: number) => void;
  destroy: () => void;
}

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate: (timeMs: number) => void;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
}

export default function VideoPlayer({ videoId, onTimeUpdate, onReady, onStateChange }: VideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const startTimeTracking = useCallback(() => {
    const tick = () => {
      if (playerInstanceRef.current) {
        const time = playerInstanceRef.current.getCurrentTime() * 1000;
        onTimeUpdate(time);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [onTimeUpdate]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const createPlayer = () => {
      if (!playerRef.current || playerInstanceRef.current) return;
      window.onYouTubeIframeAPIReady = () => { initPlayer(); };
      if (window.YT && window.YT.Player) { initPlayer(); }
    };

    const initPlayer = () => {
      if (!playerRef.current) return;
      playerInstanceRef.current = new window.YT.Player(playerRef.current, {
        videoId,
        playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { setIsLoaded(true); onReady?.(); startTimeTracking(); },
          onStateChange: (event) => { onStateChange?.(event.data); },
        },
      });
    };

    createPlayer();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (playerInstanceRef.current) { try { playerInstanceRef.current.destroy(); } catch {} playerInstanceRef.current = null; }
    };
  }, [videoId, onReady, onStateChange, startTimeTracking]);

  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      <div ref={playerRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white/50 text-lg">Loading video...</div>
        </div>
      )}
    </div>
  );
}