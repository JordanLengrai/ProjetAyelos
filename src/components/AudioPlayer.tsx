import React, { useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { useAudioStore } from '../lib/store';

export const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    file,
    currentTime,
    isPlaying,
    duration,
    setCurrentTime,
    setIsPlaying,
    setFile,
    identifyAudio,
    setAudioElement
  } = useAudioStore();

  useEffect(() => {
    if (!audioRef.current || !file) return;

    const audio = audioRef.current;
    audio.src = URL.createObjectURL(file);
    
    setAudioElement(audio);

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [file, setCurrentTime, setAudioElement]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await setFile(file);
    await identifyAudio(file);
  };

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

  return (
    <div className="relative h-[58px] bg-[#1f1f1f] flex items-center px-4">
      <audio ref={audioRef} />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="audio/*"
        onChange={handleFileUpload}
      />
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative h-6 w-6 bg-[url(/frame-1.svg)] hover:bg-[#404040]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 p-0 text-white hover:bg-[#404040] rounded-full flex items-center justify-center"
          onClick={handlePlayPause}
        >
         {isPlaying ? (
  <img src="../public/pause_button.png" alt="" width={24} height={24}/>
) : (
  <img src="../public/play_button.png" alt="" width={24} height={24}/>  
)}
        </Button>
      </div>

      <span className="ml-7 font-['Segoe UI',Helvetica] text-white text-[13px] leading-4">
        {formatTime(currentTime)}
      </span>

      <div
        className="relative flex-1 mx-5 h-5 cursor-pointer"
        onClick={handleSeek}
      >
        <div className="absolute w-full h-1 top-2 bg-[#757575] rounded-sm">
          <div
            className="absolute h-full bg-white rounded-sm"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <div
          className="absolute w-5 h-5 bg-white rounded-[10px]"
          style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <span className="font-['Segoe_UI-Regular',Helvetica] text-white text-[13px] leading-4">
        {formatTime(duration)}
      </span>

      <div className="flex items-center ml-4 gap-6">
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6 p-0 hover:bg-[#404040]"
    onClick={() => skipTime(-3)}
  >
    {/* SVG pour reculer de 3s (déjà existant) */}
    <img src="../public/go_backward.png" alt="" width={38} height={38} />
  </Button>
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6 p-0 hover:bg-[#404040]"
    onClick={() => skipTime(3)}
  >
    {/* SVG pour avancer de 3s (fourni par l’utilisateur) */}
    <img src="../public/go_forward.png" alt="" width={38} height={38} />
  </Button>
</div>
    </div>
  );
};