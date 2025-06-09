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
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" className="w-full h-full">
              <g transform="scale(0.7) translate(100,200)">
                <rect y="20.885" width="188.088" height="370.23" fill="#ffffff" />
                <rect x="323.912" y="20.885" width="188.088" height="370.23" fill="#ffffff" />
              </g>
            </svg>
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
    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.14 12.54C11.14 11.915 10.652 11.529 9.86099 11.529H8.96699V10.45H9.84599C10.515 10.45 10.969 10.054 10.969 9.47804C10.969 8.95104 10.554 8.55004 9.86499 8.55004C9.15199 8.55004 8.71299 8.91604 8.66399 9.54604H7.30199C7.35099 8.24704 8.35199 7.37304 9.93899 7.37304C11.501 7.37304 12.371 8.23704 12.366 9.26804C12.361 10.122 11.824 10.684 11.067 10.87V10.963C12.049 11.105 12.644 11.73 12.644 12.672C12.644 13.907 11.482 14.781 9.88999 14.781C8.29799 14.781 7.21399 13.912 7.15099 12.579H8.56199C8.60599 13.175 9.11399 13.556 9.87099 13.556C10.618 13.555 11.14 13.15 11.14 12.54ZM13.25 4.98204L16.981 2.74404C17.0212 2.71985 17.0544 2.68568 17.0775 2.64485C17.1005 2.60403 17.1126 2.55793 17.1126 2.51104C17.1126 2.46415 17.1005 2.41805 17.0775 2.37723C17.0544 2.3364 17.0212 2.30223 16.981 2.27804L13.25 0.0390405C13.2087 0.0142717 13.1616 0.000892023 13.1135 0.000267084C13.0654 -0.000357855 13.018 0.0117942 12.9761 0.0354832C12.9342 0.0591721 12.8993 0.09355 12.8751 0.135108C12.8508 0.176667 12.838 0.223918 12.838 0.27204V4.74904C12.838 4.96004 13.068 5.09104 13.25 4.98204ZM18.275 9.89304C18.0098 9.89304 17.7554 9.9984 17.5679 10.1859C17.3803 10.3735 17.275 10.6278 17.275 10.893C17.2747 12.285 16.8809 13.6485 16.139 14.8263C15.3971 16.004 14.3373 16.948 13.0819 17.5493C11.8265 18.1506 10.4267 18.3848 9.04397 18.2247C7.66125 18.0646 6.35196 17.5168 5.26719 16.6446C4.18241 15.7723 3.36635 14.6111 2.91317 13.295C2.45999 11.9789 2.38816 10.5614 2.70596 9.20625C3.02377 7.85105 3.71825 6.61332 4.70929 5.63587C5.70033 4.65843 6.94753 3.9811 8.30699 3.68204V4.75004C8.30699 4.96104 8.53699 5.09204 8.71899 4.98304L12.45 2.74504C12.4902 2.72085 12.5234 2.68668 12.5465 2.64585C12.5695 2.60503 12.5816 2.55893 12.5816 2.51204C12.5816 2.46515 12.5695 2.41905 12.5465 2.37823C12.5234 2.3374 12.4902 2.30323 12.45 2.27904L8.71899 0.0410405C8.67773 0.0162716 8.63064 0.00289212 8.58252 0.00226718C8.5344 0.00164224 8.48698 0.0137943 8.44509 0.0374833C8.4032 0.0611722 8.36835 0.0955499 8.34409 0.137108C8.31982 0.178667 8.30702 0.225918 8.30699 0.274041V1.64604C3.88099 2.40004 0.510986 6.25404 0.510986 10.895C0.510986 13.3833 1.49944 15.7696 3.25891 17.5291C5.01838 19.2886 7.40473 20.277 9.89299 20.277C12.3812 20.277 14.7676 19.2886 16.5271 17.5291C18.2865 15.7696 19.275 13.3833 19.275 10.895C19.2752 10.7636 19.2496 10.6333 19.1994 10.5117C19.1493 10.3902 19.0757 10.2797 18.9828 10.1866C18.8899 10.0936 18.7796 10.0197 18.6581 9.96935C18.5367 9.91897 18.4065 9.89304 18.275 9.89304Z" fill="white"/>
    </svg>
  </Button>
</div>
    </div>
  );
};