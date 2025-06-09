import React, { useRef, useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Separator } from "../../components/ui/separator";
import { AudioPlayer } from "../../components/AudioPlayer";
import { useAudioStore } from "../../lib/store";

export const Background = (): JSX.Element => {
  const syncLyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const prevSyncedCount = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingLyricId, setEditingLyricId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('sync');
  const [filterMode, setFilterMode] = useState<'all' | 'unsynced' | 'synced'>('all');
  
  const {
    file,
    title,
    artist,
    coverUrl,
    lyrics,
    editableLyrics,
    currentTime,
    isPlaying,
    setFile,
    identifyAudio,
    setLyricTimestamp,
    addLyric,
    resetLyrics,
    setEditableLyrics,
    importLyricsToSync,
    removeLyricTimestamp,
    editLyric,
    setIsPlaying,
    seekToTime,
    adjustLyricTimestamp,
    resetAllTimestamps
  } = useAudioStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await setFile(file);
    await identifyAudio(file);
  };

  const formatTimestamp = (time: number | null): string => {
    if (time === null) return "00:00.00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const handleSyncLyric = (lyricId: number) => {
    setLyricTimestamp(lyricId, currentTime);
  };

  const handleRemoveTimestamp = (lyricId: number) => {
    removeLyricTimestamp(lyricId);
  };

  const handleEditLyric = (lyric: any) => {
    setEditingLyricId(lyric.id);
    setEditingText(lyric.text);
  };

  const handleSaveEdit = () => {
    if (editingLyricId !== null) {
      editLyric(editingLyricId, editingText);
      setEditingLyricId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingLyricId(null);
    setEditingText('');
  };

  const handlePlayAtTime = (timestamp: number | null) => {
    if (timestamp !== null) {
      seekToTime(timestamp);
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
  };

  const handleFinish = () => {
    const allSynced = lyrics.every(lyric => lyric.timestamp !== null);
    if (!allSynced) {
      alert('Please sync all lyrics before finishing');
      return;
    }

    const lrcContent = lyrics
      .filter(lyric => lyric.timestamp !== null)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(lyric => {
        const time = lyric.timestamp || 0;
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 100);
        return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]${lyric.text}`;
      })
      .join('\n');

    const blob = new Blob([lrcContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.lrc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter lyrics based on selected mode
  const filteredLyrics = lyrics.filter(lyric => {
    switch (filterMode) {
      case 'unsynced':
        return lyric.timestamp === null;
      case 'synced':
        return lyric.timestamp !== null;
      default:
        return true;
    }
  });

  const allCount = lyrics.length;
  const unsyncedCount = lyrics.filter(l => l.timestamp === null).length;
  const syncedCount = lyrics.filter(l => l.timestamp !== null).length;

  // Scroll auto sync lyrics container to bottom when new timestamp is added
  useEffect(() => {
    if (!syncLyricsContainerRef.current) return;
    if (syncedCount > prevSyncedCount.current) {
      // Ajout : scroll vers le bas
      syncLyricsContainerRef.current.scrollBy({
        top: 40,
        behavior: 'smooth',
      });
    } else if (syncedCount < prevSyncedCount.current) {
      // Suppression : scroll vers le haut
      syncLyricsContainerRef.current.scrollBy({
        top: -40,
        behavior: 'smooth',
      });
    }
    prevSyncedCount.current = syncedCount;
  }, [syncedCount]);

  // Trouve l'index de la ligne jouée
const currentLyricIdx = (() => {
  let idx = -1;
  let lastTimestamp = -1;
  filteredLyrics.forEach((l, i) => {
    if (l.timestamp !== null && l.timestamp <= currentTime && l.timestamp >= lastTimestamp) {
      idx = i;
      lastTimestamp = l.timestamp;
    }
  });
  return idx;
})();

return (
    <main className="w-full h-screen bg-[#131313] flex flex-col overflow-hidden">
      <div className="relative flex-1 flex flex-col min-h-0">
        <header className="h-[121px] bg-[#1f1f1f] border-b border-[#343434] shadow-[0px_8px_80px_#13131314] flex flex-col flex-shrink-0">
          <div className="flex-1 flex items-center justify-between px-4 sm:px-7">
            <div className="flex items-center gap-4">
              {file && coverUrl !== '' && (
                <img
                  className="w-[50px] h-[50px] object-cover rounded-lg"
                  alt="Cover"
                  src={coverUrl}
                />
              )}
              <div className="flex flex-col">
                <h1 className="font-['Segoe UI',Helvetica] font-semibold text-white text-[17px] leading-5 truncate max-w-[200px] sm:max-w-none">
                  {title || "No file selected"}
                </h1>
                <p className="font-['Segoe UI',Helvetica] font-normal text-[#bdbdbd] text-[15px] leading-5 truncate max-w-[200px] sm:max-w-none">
                  {artist || "Upload an audio file to begin"}
                </p>
              </div>
            </div>
            <Button 
              className="bg-white text-[#131313] rounded-lg h-12 px-6 hidden sm:block"
              onClick={handleFinish}
            >
              Finish
            </Button>
          </div>

          <div className="h-[60px] border-t border-[#343434] flex items-center justify-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="bg-transparent p-0 h-auto flex flex-row items-center justify-center gap-x-2 w-full mt-1.5">
  <TabsTrigger
    value="lyrics"
    className="h-12 px-7 text-[17px] font-['Segoe UI',Helvetica] font-semibold text-white rounded-[48px] transition-all duration-150
      data-[state=active]:bg-[#343434] data-[state=active]:text-white
      data-[state=inactive]:bg-transparent data-[state=inactive]:text-white
      data-[state=inactive]:hover:bg-[#343434]/60"
  >
    Lyrics
  </TabsTrigger>
  <TabsTrigger
    value="sync"
    className="h-12 px-7 text-[17px] font-['Segoe UI',Helvetica] font-semibold text-white rounded-[48px] transition-all duration-150
      data-[state=active]:bg-[#343434] data-[state=active]:text-white
      data-[state=inactive]:bg-transparent data-[state=inactive]:text-white
      data-[state=inactive]:hover:bg-[#343434]/60"
  >
    Sync
  </TabsTrigger>
</TabsList>
            </Tabs>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col min-h-0">
              <TabsContent value="sync" className="flex-1 m-0 flex flex-col min-h-0">
                <div className="flex flex-col h-full min-h-0">
                  <div className="flex flex-wrap items-center justify-between px-4 sm:px-7 py-4 border-b border-[#343434] gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <Button 
                        variant="ghost" 
                        className={`text-white hover:text-white hover:bg-[#343434]/60 ${filterMode === 'all' ? 'bg-[#343434]' : ''}`}
                        onClick={() => setFilterMode('all')}
                      >
                        All ({allCount})
                      </Button>
                      <Button 
                        variant="ghost" 
                        className={`text-white hover:text-white hover:bg-[#343434]/60 ${filterMode === 'unsynced' ? 'bg-[#343434]' : ''}`}
                        onClick={() => setFilterMode('unsynced')}
                      >
                        Unsynced ({unsyncedCount})
                      </Button>
                      <Button 
                        variant="ghost" 
                        className={`text-white hover:text-white hover:bg-[#343434]/60 ${filterMode === 'synced' ? 'bg-[#343434]' : ''}`}
                        onClick={() => setFilterMode('synced')}
                      >
                        Synced ({syncedCount})
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <Button 
                        variant="ghost" 
                        className="text-white hover:text-white hover:bg-[#343434]/60"
                        onClick={resetAllTimestamps}
                      >
                        Reset all
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 relative overflow-hidden min-h-0">
                    
                    
                    {/* Bottom blur gradient - Much larger and stronger */}
                    <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[#131313] via-[#131313]/98 via-[#131313]/95 via-[#131313]/90 via-[#131313]/80 via-[#131313]/60 via-[#131313]/40 via-[#131313]/20 to-transparent z-10 pointer-events-none"></div>
                    
                    <div className="h-full overflow-y-auto px-6 py-8 pb-80" ref={syncLyricsContainerRef}>
                      {filteredLyrics.length === 0 ? (
                        <div className="text-center text-[#757575] py-8">
                          <p className="mb-4">
                            {filterMode === 'all' && 'No lyrics to sync yet.'}
                            {filterMode === 'unsynced' && 'No unsynced lyrics.'}
                            {filterMode === 'synced' && 'No synced lyrics yet.'}
                          </p>
                          {filterMode === 'all' && (
                            <p className="text-sm">
                              Go to the "Lyrics" tab to add lyrics. They will automatically appear here for synchronization.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredLyrics.map((lyric, index) => {
                            // Only apply fade to unsynced lyrics at the bottom
                            const totalItems = filteredLyrics.length;
                            const isNearBottom = index >= totalItems - 8;
                            const isUnsynced = lyric.timestamp === null;
                            let fadeOpacity = 1;
                            
                            if (isNearBottom && isUnsynced) {
                              const distanceFromEnd = totalItems - index - 1;
                              fadeOpacity = 0.2 + (0.8 * distanceFromEnd / 7);
                            }
                            
                            return (
                              <div 
                                key={lyric.id} 
                                className={`flex items-center gap-4 transition-opacity duration-300 ${lyric.timestamp === null ? 'opacity-40' : ''} ${index === currentLyricIdx ? 'bg-gradient-to-r from-[#2e8fff]/30 to-transparent' : ''}`}
                                style={{ opacity: fadeOpacity }}
                              >
                                {lyric.timestamp !== null && (
                                  <>
                                    {/* Remove timestamp button */}
                                    <button
                                      onClick={() => handleRemoveTimestamp(lyric.id)}
                                      className="w-8 h-8 rounded-full bg-[#2a2a2a] hover:bg-[#404040] border border-[#555] flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-110"
                                      title="Remove timestamp"
                                    >
                                      ✕
                                    </button>

                                    {/* Navigation controls - BACKWARD */}
                                    <div className="flex items-center gap-1">
                                      <button 
                                        className="w-8 h-8 rounded bg-[#404040] hover:bg-[#555] border border-[#666] flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:scale-110"
                                        onClick={() => adjustLyricTimestamp(lyric.id, -0.03)}
                                        disabled={lyric.timestamp === null}
                                        title="Move timestamp -30ms"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M11 18V6L5.5 12L11 18ZM18.5 6V18L13 12L18.5 6Z" fill="currentColor"/>
                                        </svg>
                                      </button>
                                      <button 
                                        className="w-8 h-8 rounded bg-[#555] hover:bg-[#666] border border-[#777] flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:scale-110"
                                        onClick={() => adjustLyricTimestamp(lyric.id, -0.01)}
                                        disabled={lyric.timestamp === null}
                                        title="Move timestamp -10ms"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M15.5 12L9 18V6L15.5 12Z" fill="currentColor"/>
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="w-20 text-center">
                                      <span className="font-mono text-sm font-bold text-white">
                                        {formatTimestamp(lyric.timestamp)}
                                      </span>
                                    </div>

                                    {/* Navigation controls - FORWARD */}
                                    <div className="flex items-center gap-1">
                                      <button 
                                        className="w-8 h-8 rounded bg-[#666] hover:bg-[#777] border border-[#888] flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:scale-110"
                                        onClick={() => adjustLyricTimestamp(lyric.id, 0.01)}
                                        disabled={lyric.timestamp === null}
                                        title="Move timestamp +10ms"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M8.5 12L15 6V18L8.5 12Z" fill="currentColor"/>
                                        </svg>
                                      </button>
                                      <button 
                                        className="w-8 h-8 rounded bg-[#777] hover:bg-[#888] border border-[#999] flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:scale-110"
                                        onClick={() => adjustLyricTimestamp(lyric.id, 0.03)}
                                        disabled={lyric.timestamp === null}
                                        title="Move timestamp +30ms"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M13 6V18L18.5 12L13 6ZM5.5 18V6L11 12L5.5 18Z" fill="currentColor"/>
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Play button with normal SVG */}
                                    <button
                                      onClick={() => handlePlayAtTime(lyric.timestamp)}
                                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 border-2 ${
                                        lyric.timestamp !== null 
                                          ? 'bg-white hover:bg-gray-200 border-gray-300 text-black' 
                                          : 'bg-[#555] text-white cursor-not-allowed border-[#666]'
                                      }`}
                                      disabled={lyric.timestamp === null}
                                      title={lyric.timestamp !== null ? "Play from this timestamp" : "No timestamp set"}
                                    >
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                                      </svg>
                                    </button>
                                  </>
                                )}
                                {/* Lyric text */}
                                <div className="flex-1">
                                  {editingLyricId === lyric.id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        className="flex-1 bg-transparent text-white border-none outline-none"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveEdit();
                                          if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        onClick={handleSaveEdit}
                                        className="bg-white text-black hover:bg-gray-200 px-2 py-1 text-xs"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelEdit}
                                        className="text-white px-2 py-1 text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <span 
                                      className="text-white cursor-pointer hover:text-gray-300"
                                      onClick={() => handleEditLyric(lyric)}
                                    >
                                      {lyric.text}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Static control buttons */}
                    {lyrics.length > 0 && (
                      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-8 z-20">
                        <button
                          onClick={() => {
                            const syncedLyrics = lyrics.filter(l => l.timestamp !== null);
                            if (syncedLyrics.length > 0) {
                              const lastSyncedLyric = syncedLyrics[syncedLyrics.length - 1];
                              handleRemoveTimestamp(lastSyncedLyric.id);
                            }
                          }}
                          className="w-[220px] h-[56px] rounded-xl bg-[#343434] hover:bg-[#404040] flex flex-col items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Remove timestamp from last synced lyric"
                        >
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 14L12 9L7 14H17Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            const currentLyric = lyrics.find(l => l.timestamp === null);
                            if (currentLyric) {
                              handleSyncLyric(currentLyric.id);
                            }
                          }}
                          className="w-[220px] h-[56px] rounded-xl bg-white hover:bg-gray-100 flex flex-col items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Add timestamp to next unsynced lyric"
                        >
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 10L12 15L17 10H7Z" fill="#000000" stroke="#000000" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="lyrics" className="flex-1 m-0 min-h-0">
                <div className="h-full flex flex-col min-h-0">
                  {/* Full-screen textarea without borders */}
                  <textarea
                    value={editableLyrics}
                    onChange={(e) => setEditableLyrics(e.target.value)}
                    className="flex-1 w-full bg-[#131313] text-white border-none outline-none resize-none font-mono text-sm leading-relaxed p-6"
                    placeholder=""
                    style={{ border: 'none', boxShadow: 'none', marginTop: '-310px' }}
                  />
                  
                  {/* Bottom info bar */}
                  <div className="flex items-center justify-between p-4 border-t border-[#343434] flex-shrink-0">
                    <div className="text-sm text-[#757575]">
                      Tip: Each line will automatically be imported to the Sync tab as you type. No need to manually import anymore!
                    </div>
                    <div className="text-sm text-white font-medium">
                      ✓ Auto-sync enabled
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Fixed audio player at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1f1f1f] border-t border-[#343434]">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/flac,.mp3,.flac"
            className="hidden"
            onChange={handleFileUpload}
          />
          <AudioPlayer />
        </div>

        {/* Mobile finish button */}
        <Button 
          className="fixed bottom-20 right-4 bg-white text-[#131313] rounded-lg h-12 px-6 sm:hidden z-40"
          onClick={handleFinish}
        >
          Finish
        </Button>
      </div>
    </main>
  );
};