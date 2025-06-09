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
    
    // Store audio element reference in store
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
          <div className="relative h-6 w-6 bg-[url(/frame-1.svg)] bg-[100%_100%]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 p-0 text-white hover:bg-[#404040] rounded-full flex items-center justify-center"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" width="24" height="24" viewBox="0 0 24 24"><path d="M10.5 5.6v12.8A1.6 1.6 0 0 1 8.9 20H7.1a1.6 1.6 0 0 1-1.6-1.6V5.6A1.6 1.6 0 0 1 7.1 4h1.8a1.6 1.6 0 0 1 1.6 1.6zM16.9 4h-1.8a1.6 1.6 0 0 0-1.6 1.6v12.8a1.6 1.6 0 0 0 1.6 1.6h1.8a1.6 1.6 0 0 0 1.6-1.6V5.6A1.6 1.6 0 0 0 16.9 4z" fill="#FFFFFF"></path></svg>
          ) : (
            <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.69 13.828L8.41 19.996C8.17505 20.1372 7.90684 20.2134 7.63279 20.2169C7.35874 20.2204 7.08867 20.151 6.85018 20.016C6.61169 19.8809 6.41334 19.685 6.27539 19.4481C6.13744 19.2113 6.06484 18.9421 6.065 18.668V6.33104C6.06484 6.05697 6.13744 5.78776 6.27539 5.55094C6.41334 5.31412 6.61169 5.11816 6.85018 4.9831C7.08867 4.84805 7.35874 4.77873 7.63279 4.78223C7.90684 4.78573 8.17505 4.86193 8.41 5.00304L18.691 11.172C18.9202 11.3098 19.1098 11.5045 19.2415 11.7373C19.3731 11.97 19.4422 12.2329 19.4421 12.5003C19.442 12.7677 19.3727 13.0306 19.2409 13.2632C19.1091 13.4959 18.9193 13.6905 18.69 13.828Z" fill="white"/>
            </svg>
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
    className="h-6 w-6 p-0"
    onClick={() => skipTime(-3)}
  >
    {/* SVG pour reculer de 3s (déjà existant) */}
    <svg width="20" height="21" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4.80499 4.24404C4.76482 4.21985 4.73159 4.18568 4.70852 4.14485C4.68545 4.10403 4.67333 4.05793 4.67333 4.01104C4.67333 3.96415 4.68545 3.91805 4.70852 3.87723C4.73159 3.8364 4.76482 3.80223 4.80499 3.77804L8.53599 1.54004C8.57712 1.51498 8.62418 1.50134 8.67233 1.50051C8.72049 1.49968 8.76799 1.5117 8.80996 1.53533C8.85192 1.55897 8.88683 1.59335 8.91109 1.63496C8.93535 1.67656 8.94809 1.72388 8.94799 1.77204V6.24904C8.94795 6.29716 8.93515 6.34441 8.91089 6.38597C8.88662 6.42753 8.85177 6.46191 8.80988 6.4856C8.768 6.50929 8.72057 6.52144 8.67245 6.52081C8.62434 6.52019 8.57725 6.50681 8.53599 6.48204L4.80499 4.24404ZM13.479 3.14404V1.77204C13.479 1.72392 13.4661 1.67667 13.4419 1.63511C13.4176 1.59355 13.3828 1.55917 13.3409 1.53548C13.299 1.51179 13.2516 1.49964 13.2035 1.50027C13.1553 1.50089 13.1082 1.51427 13.067 1.53904L9.33599 3.77804C9.29582 3.80223 9.26259 3.8364 9.23952 3.87723C9.21645 3.91805 9.20433 3.96415 9.20433 4.01104C9.20433 4.05793 9.21645 4.10403 9.23952 4.14485C9.26259 4.18568 9.29582 4.21985 9.33599 4.24404L13.067 6.48204C13.1082 6.50681 13.1553 6.52019 13.2035 6.52081C13.2516 6.52144 13.299 6.50929 13.3409 6.4856C13.3828 6.46191 13.4176 6.42753 13.4419 6.38597C13.4661 6.34441 13.479 6.29716 13.479 6.24904V5.18104C14.8384 5.4801 16.0856 6.15743 17.0767 7.13487C18.0677 8.11232 18.7622 9.35005 19.08 10.7052C19.3978 12.0604 19.326 13.4779 18.8728 14.794C18.4196 16.1101 17.6036 17.2713 16.5188 18.1436C15.434 19.0158 14.1247 19.5636 12.742 19.7237C11.3593 19.8838 9.95946 19.6496 8.70408 19.0483C7.44869 18.447 6.3889 17.503 5.64698 16.3253C4.90506 15.1475 4.51125 13.784 4.51099 12.392C4.51099 12.1268 4.40563 11.8725 4.21809 11.6849C4.03056 11.4974 3.7762 11.392 3.51099 11.392C3.24577 11.392 2.99142 11.4974 2.80388 11.6849C2.61634 11.8725 2.51099 12.1268 2.51099 12.392C2.51118 14.1798 3.02214 15.9302 3.98371 17.4373C4.94529 18.9444 6.31743 20.1454 7.93861 20.8989C9.55979 21.6524 11.3625 21.9271 13.1345 21.6905C14.9065 21.4539 16.574 20.716 17.9408 19.5636C19.3075 18.4112 20.3165 16.8923 20.8491 15.1857C21.3816 13.4792 21.4155 11.656 20.9467 9.9308C20.4779 8.20563 19.526 6.65031 18.203 5.44795C16.88 4.24559 15.241 3.44625 13.479 3.14404ZM11.871 15.055C11.114 15.055 10.606 14.674 10.562 14.078H9.15099C9.21399 15.411 10.299 16.28 11.89 16.28C13.481 16.28 14.644 15.406 14.644 14.171C14.644 13.229 14.048 12.604 13.067 12.462V12.37C13.824 12.185 14.361 11.623 14.366 10.768C14.371 9.73804 13.502 8.87304 11.939 8.87304C10.352 8.87304 9.35099 9.74704 9.30199 11.046H10.664C10.713 10.416 11.152 10.05 11.865 10.05C12.554 10.05 12.969 10.45 12.969 10.978C12.969 11.554 12.515 11.95 11.846 11.95H10.967V13.029H11.861C12.652 13.029 13.14 13.415 13.14 14.04C13.14 14.65 12.618 15.055 11.871 15.055Z" fill="white"/>
</svg>
  </Button>
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6 p-0"
    onClick={() => skipTime(3)}
  >
    {/* SVG pour avancer de 3s (fourni par l’utilisateur) */}
    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.14 14.04C13.14 13.415 12.652 13.029 11.861 13.029H10.967V11.95H11.846C12.515 11.95 12.969 11.554 12.969 10.978C12.969 10.451 12.554 10.05 11.865 10.05C11.152 10.05 10.713 10.416 10.664 11.046H9.30199C9.35099 9.74704 10.352 8.87304 11.939 8.87304C13.501 8.87304 14.371 9.73704 14.366 10.768C14.361 11.622 13.824 12.184 13.067 12.37V12.463C14.049 12.605 14.644 13.23 14.644 14.172C14.644 15.407 13.482 16.281 11.89 16.281C10.298 16.281 9.21399 15.412 9.15099 14.079H10.562C10.606 14.675 11.114 15.056 11.871 15.056C12.618 15.055 13.14 14.65 13.14 14.04ZM15.25 6.48204L18.981 4.24404C19.0212 4.21985 19.0544 4.18568 19.0775 4.14485C19.1005 4.10403 19.1126 4.05793 19.1126 4.01104C19.1126 3.96415 19.1005 3.91805 19.0775 3.87723C19.0544 3.8364 19.0212 3.80223 18.981 3.77804L15.25 1.53904C15.2087 1.51427 15.1616 1.50089 15.1135 1.50027C15.0654 1.49964 15.018 1.51179 14.9761 1.53548C14.9342 1.55917 14.8993 1.59355 14.8751 1.63511C14.8508 1.67667 14.838 1.72392 14.838 1.77204V6.24904C14.838 6.46004 15.068 6.59104 15.25 6.48204ZM20.275 11.393C20.0098 11.393 19.7554 11.4984 19.5679 11.6859C19.3803 11.8735 19.275 12.1278 19.275 12.393C19.2747 13.785 18.8809 15.1485 18.139 16.3263C17.3971 17.504 16.3373 18.448 15.0819 19.0493C13.8265 19.6506 12.4267 19.8848 11.044 19.7247C9.66125 19.5646 8.35196 19.0168 7.26719 18.1446C6.18241 17.2723 5.36635 16.1111 4.91317 14.795C4.45999 13.4789 4.38816 12.0614 4.70596 10.7062C5.02377 9.35105 5.71825 8.11332 6.70929 7.13587C7.70033 6.15843 8.94753 5.4811 10.307 5.18204V6.25004C10.307 6.46104 10.537 6.59204 10.719 6.48304L14.45 4.24504C14.4902 4.22085 14.5234 4.18668 14.5465 4.14585C14.5695 4.10503 14.5816 4.05893 14.5816 4.01204C14.5816 3.96515 14.5695 3.91905 14.5465 3.87823C14.5234 3.8374 14.4902 3.80323 14.45 3.77904L10.719 1.54104C10.6777 1.51627 10.6306 1.50289 10.5825 1.50227C10.5344 1.50164 10.487 1.51379 10.4451 1.53748C10.4032 1.56117 10.3683 1.59555 10.3441 1.63711C10.3198 1.67867 10.307 1.72592 10.307 1.77404V3.14604C5.88099 3.90004 2.51099 7.75404 2.51099 12.395C2.51099 14.8833 3.49944 17.2696 5.25891 19.0291C7.01838 20.7886 9.40473 21.777 11.893 21.777C14.3812 21.777 16.7676 20.7886 18.5271 19.0291C20.2865 17.2696 21.275 14.8833 21.275 12.395C21.2752 12.2636 21.2496 12.1333 21.1994 12.0117C21.1493 11.8902 21.0757 11.7797 20.9828 11.6866C20.8899 11.5936 20.7796 11.5197 20.6581 11.4694C20.5367 11.419 20.4065 11.393 20.275 11.393Z" fill="white"/>
</svg>
  </Button>
</div>
    </div>
  );
};