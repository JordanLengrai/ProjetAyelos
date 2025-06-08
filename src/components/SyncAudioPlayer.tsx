import React, { useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { useAudioStore } from '../lib/store';

export const SyncAudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { 
    file,
    currentTime,
    isPlaying,
    duration,
    setCurrentTime,
    setIsPlaying,
  } = useAudioStore();

  useEffect(() => {
    if (!audioRef.current || !file) return;

    const audio = audioRef.current;
    audio.src = URL.createObjectURL(file);

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, [file]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    
    const newTime = audioRef.current.currentTime + seconds;
    audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!file) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
        <div className="text-center text-[#757575]">
          No audio file loaded. Please upload an audio file first.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
      <audio ref={audioRef} />
      
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 p-0 bg-white hover:bg-gray-200"
          onClick={handlePlayPause}
        >
          <img
            className="w-6 h-6"
            alt="PlayIcon/Pause"
            src={isPlaying ? "/pause.svg" : "/svg-1.svg"}
          />
        </Button>

        {/* Skip Backward */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 text-white hover:bg-[#404040]"
          onClick={() => skipTime(-5)}
        >
          <span className="text-sm">-5s</span>
        </Button>

        {/* Current Time */}
        <span className="text-white text-sm font-mono min-w-[50px]">
          {formatTime(currentTime)}
        </span>

        {/* Progress Bar */}
        <div
          className="relative flex-1 h-6 cursor-pointer"
          onClick={handleSeek}
        >
          <div className="absolute w-full h-2 top-2 bg-[#757575] rounded-sm">
            <div
              className="absolute h-full bg-white rounded-sm"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <div
            className="absolute w-4 h-4 bg-white rounded-full border-2 border-[#2a2a2a]"
            style={{ 
              left: `${(currentTime / duration) * 100}%`, 
              transform: 'translateX(-50%)',
              top: '4px'
            }}
          />
        </div>

        {/* Duration */}
        <span className="text-white text-sm font-mono min-w-[50px]">
          {formatTime(duration)}
        </span>

        {/* Skip Forward */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 text-white hover:bg-[#404040]"
          onClick={() => skipTime(5)}
        >
          <span className="text-sm">+5s</span>
        </Button>

        {/* Skip Forward More */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 text-white hover:bg-[#404040]"
          onClick={() => skipTime(10)}
        >
          <span className="text-sm">+10s</span>
        </Button>
      </div>

      {/* Current Time Display */}
      <div className="mt-2 text-center">
        <span className="text-[#757575] text-xs">
          Current position: {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};