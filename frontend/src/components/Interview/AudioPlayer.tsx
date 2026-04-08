import { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  base64Audio: string | null;
  onFinished?: () => void;
}

export function AudioPlayer({ base64Audio, onFinished }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (base64Audio) {
      // 1. Create the data URL from Base64
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error("Playback failed:", err));
      }
    }
  }, [base64Audio]);

  const handleEnded = () => {
    setIsPlaying(false);
    if (onFinished) onFinished();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 backdrop-blur-md">
      <audio ref={audioRef} onEnded={handleEnded} className="hidden" />
      
      {/* Animated Pulse Visualizer */}
      <div className="relative mb-4">
        <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-xl transition-opacity duration-500 ${isPlaying ? 'opacity-40 animate-pulse' : 'opacity-0'}`} />
        <div className={`relative p-8 rounded-full border-2 transition-all duration-300 ${isPlaying ? 'border-indigo-400 bg-indigo-950/30' : 'border-slate-600 bg-slate-900'}`}>
          {isPlaying ? (
            <Volume2 className="w-12 h-12 text-indigo-400 animate-bounce" />
          ) : (
            <VolumeX className="w-12 h-12 text-slate-500" />
          )}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-300">
        {isPlaying ? "AI is speaking..." : "AI is listening..."}
      </p>

      {/* Visual Waveform Mockup */}
      <div className="flex space-x-1 mt-4 h-8 items-center">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-indigo-500/60 rounded-full transition-all duration-150 ${isPlaying ? 'animate-waveform' : 'h-1'}`}
            style={{ 
              animationDelay: `${i * 0.1}s`,
              height: isPlaying ? '100%' : '4px' 
            }}
          />
        ))}
      </div>
    </div>
  );
}