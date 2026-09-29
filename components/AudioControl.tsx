'use client';

import { useState, useRef } from 'react';
import { EXPERIENCE_CONFIG } from '@/config/experience';

export function AudioControl() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    
    setIsPlaying(!isPlaying);
  };
  
  if (!EXPERIENCE_CONFIG.ENABLE_AUDIO) return null;
  
  return (
    <>
      <audio
        ref={audioRef}
        src={EXPERIENCE_CONFIG.MUSIC_PATH}
        loop
        preload="none"
      />
      
      <button
        onClick={togglePlay}
        className="fixed top-6 right-6 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </>
  );
}
