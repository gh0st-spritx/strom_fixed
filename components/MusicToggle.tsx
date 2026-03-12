'use client';
import { Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function MusicToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, []);

  const toggle = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/music.mp3" autoPlay loop />
      <button 
        onClick={toggle}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all"
      >
        {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </>
  );
}
