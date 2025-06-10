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

  
  useEffect(() => {
    if (!syncLyricsContainerRef.current) return;
    if (syncedCount > prevSyncedCount.current) {
      
      syncLyricsContainerRef.current.scrollBy({
        top: 40,
        behavior: 'smooth',
      });
    } else if (syncedCount < prevSyncedCount.current) {
      
      syncLyricsContainerRef.current.scrollBy({
        top: -40,
        behavior: 'smooth',
      });
    }
    prevSyncedCount.current = syncedCount;
  }, [syncedCount]);

  
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
                    
                    
                    {}
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
                                {lyric.timestamp !== null ? (
  <>
    {/* Croix */}
    <button
      onClick={() => handleRemoveTimestamp(lyric.id)}
      className="w-10 h-10 rounded-full bg-[#343434] hover:bg-[#404040] flex items-center justify-center text-white font-bold transition-all duration-200"
      title="Remove timestamp"
    >
      ✕
    </button>
    {/* Capsule centrale : << < timestamp > >> */}
    <div className="flex flex-row items-center justify-between bg-[#343434] rounded-full" style={{ width: 182, height: 36, minWidth: 182, minHeight: 36, maxWidth: 182, maxHeight: 36, padding: 0 }}>
      <button
        className="w-6 h-6 hover:bg-[#555] flex items-center justify-center text-white text-xs font-bold transition-all duration-200"
        onClick={() => adjustLyricTimestamp(lyric.id, -0.03)}
        title="Move timestamp -30ms"
      >
        <svg fill="white" height="16" viewBox="0 0 24 24" width="16"><path d="M11.629 18.775a1.357 1.357 0 0 1 0 1.865c-.468.48-1.207.48-1.675 0l-7.631-7.83a1.176 1.176 0 0 1 0-1.618L9.954 3.36c.234-.24.536-.36.838-.36.301 0 .603.12.837.359a1.357 1.357 0 0 1 0 1.865l-6.392 6.559a.313.313 0 0 0 0 .433l6.392 6.559zm2.608-6.559a.313.313 0 0 1 0-.433l6.392-6.559a1.357 1.357 0 0 0 0-1.865A1.17 1.17 0 0 0 19.792 3c-.302 0-.604.12-.838.359l-7.631 7.832a1.176 1.176 0 0 0 0 1.618l7.631 7.83c.468.48 1.207.48 1.675 0a1.357 1.357 0 0 0 0-1.865l-6.392-6.558z"></path></svg>
      </button>
      <button
        className="w-6 h-6 hover:bg-[#666] flex items-center justify-center text-white text-xs font-bold transition-all duration-200"
        onClick={() => adjustLyricTimestamp(lyric.id, -0.01)}
        title="Move timestamp -10ms"
      >
        <svg fill="white" height="16" viewBox="0 0 24 24" width="16"><path d="M14.954 3.359l-7.631 7.832a1.176 1.176 0 0 0 0 1.618l7.631 7.83c.468.48 1.207.48 1.675 0a1.357 1.357 0 0 0 0-1.865l-6.392-6.559a.313.313 0 0 1 0-.433l6.392-6.559a1.357 1.357 0 0 0 0-1.865A1.174 1.174 0 0 0 15.792 3c-.302 0-.604.12-.838.359z"></path></svg>
      </button>
      <span className="text-white min-w-[62px] text-center px-1" style={{fontFamily: 'Segoe UI, Helvetica', fontSize: 15}}>
        {formatTimestamp(lyric.timestamp)}
      </span>
      <button
        className="w-6 h-6 hover:bg-[#777] flex items-center justify-center text-white text-xs transition-all duration-200"
        onClick={() => adjustLyricTimestamp(lyric.id, 0.01)}
        title="Move timestamp +10ms"
      >
        <svg fill="white" height="16" viewBox="0 0 24 24" width="16"><path d="M9.046 20.641l7.631-7.832c.43-.441.43-1.176 0-1.618L9.046 3.36a1.154 1.154 0 0 0-1.675 0 1.357 1.357 0 0 0 0 1.865l6.391 6.559a.313.313 0 0 1 0 .433l-6.391 6.559a1.357 1.357 0 0 0 0 1.865c.235.239.536.359.837.359.302 0 .604-.12.838-.359z"></path></svg>
      </button>
      <button
        className="w-6 h-6 hover:bg-[#888] flex items-center justify-center text-white text-xs font-bold transition-all duration-200"
        onClick={() => adjustLyricTimestamp(lyric.id, 0.03)}
        title="Move timestamp +30ms"
      >
        <svg fill="white" height="16" viewBox="0 0 24 24" width="16"><path d="M12.677 12.809l-7.631 7.832a1.17 1.17 0 0 1-.838.359c-.301 0-.603-.12-.837-.359a1.357 1.357 0 0 1 0-1.865l6.391-6.559a.313.313 0 0 0 0-.433L3.371 5.225a1.357 1.357 0 0 1 0-1.865 1.154 1.154 0 0 1 1.675 0l7.631 7.83c.43.443.43 1.178 0 1.619zm9-1.619l-7.631-7.83a1.154 1.154 0 0 0-1.675 0 1.357 1.357 0 0 0 0 1.865l6.392 6.559a.313.313 0 0 1 0 .433l-6.392 6.559a1.357 1.357 0 0 0 0 1.865c.235.239.536.359.837.359.302 0 .604-.12.838-.359l7.631-7.832c.43-.441.43-1.176 0-1.619z"></path></svg>
      </button>
    </div>
    <button
      onClick={() => handlePlayAtTime(lyric.timestamp)}
      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 bg-[#343434] hover:bg-gray-200 text-white`}
      title="Play from this timestamp"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
      </svg>
    </button>
  </>
) : (
  <div style={{ width: 10 + 182 + 10, minWidth: 292, maxWidth: 202, height: 36, display: 'flex', alignItems: 'center' }}></div>
)}
                                {}
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

                    {}
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
                          className="w-[220px] h-[56px] rounded-xl bg-[#343434] hover:bg-[#404040] flex flex-col items-center justify-center shadow-2xl transition-all duration-200"
                          title="Remove timestamp from last synced lyric"
                        >
                          <svg width="24" height="11" viewBox="0 0 24 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.303 6.569L10.88 1.008C11.184 0.830258 11.5299 0.736716 11.882 0.737C11.933 0.737 11.982 0.753 12.033 0.756C12.083 0.752 12.132 0.737 12.182 0.737C12.517 0.737 12.857 0.821 13.169 0.999L22.878 6.526C23.3251 6.7955 23.6491 7.22904 23.781 7.73413C23.9129 8.23921 23.8422 8.77585 23.584 9.22954C23.3258 9.68322 22.9005 10.018 22.3989 10.1625C21.8972 10.307 21.359 10.2498 20.899 10.003L12.039 4.959L3.31 10.028C2.8521 10.2808 2.31338 10.3442 1.80932 10.2045C1.30527 10.0648 0.87598 9.73324 0.613481 9.28083C0.350981 8.82842 0.276157 8.29118 0.405049 7.78426C0.53394 7.27734 0.856287 6.84108 1.303 6.569Z" fill="#828282"/>
</svg> 
                        </button>
                        <button
                          onClick={() => {
                            const currentLyric = lyrics.find(l => l.timestamp === null);
                            if (currentLyric) {
                              handleSyncLyric(currentLyric.id);
                            }
                          }}
                          className="w-[220px] h-[56px] rounded-xl bg-white hover:bg-gray-100 flex flex-col items-center justify-center shadow-2xl transition-all duration-200"
                          title="Add timestamp to next unsynced lyric"
                        >
                          <svg width="24" height="11" viewBox="0 0 24 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.894 4.468L13.317 10.029C13.013 10.2067 12.6671 10.3003 12.315 10.3C12.264 10.3 12.215 10.284 12.164 10.281C12.114 10.285 12.065 10.3 12.015 10.3C11.68 10.3 11.34 10.216 11.028 10.038L1.319 4.511C0.871925 4.2415 0.547863 3.80795 0.415962 3.30287C0.284061 2.79778 0.354765 2.26115 0.612988 1.80746C0.871212 1.35378 1.29651 1.01896 1.79814 0.874461C2.29976 0.729959 2.838 0.787209 3.29801 1.034L12.158 6.078L20.887 1.009C21.3449 0.756199 21.8836 0.692845 22.3877 0.832512C22.8917 0.97218 23.321 1.30375 23.5835 1.75616C23.846 2.20857 23.9208 2.74582 23.792 3.25274C23.6631 3.75966 23.3407 4.19591 22.894 4.468Z" fill="#131313"/>
</svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="lyrics" className="flex-1 m-0 min-h-0">
                <div className="h-full flex flex-col min-h-0">
                  
                  <textarea
                    value={editableLyrics}
                    onChange={(e) => setEditableLyrics(e.target.value)}
                    className="flex-1 w-full bg-[#131313] text-white border-none outline-none resize-none font-mono text-sm leading-relaxed p-6"
                    placeholder=""
                    style={{ border: 'none', boxShadow: 'none', marginTop: '-310px' }}
                  />
                  
                  {}
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

        {}
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

        {}
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