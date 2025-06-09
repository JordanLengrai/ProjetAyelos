import { create } from 'zustand';
import * as musicMetadata from 'music-metadata-browser';

interface Lyric {
  id: number;
  text: string;
  timestamp: number | null;
}

interface AudioState {
  file: File | null;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  lyrics: Lyric[];
  
  editableLyrics: string;
  audioElement: HTMLAudioElement | null;
  setFile: (file: File) => Promise<void>;
  setMetadata: (title: string, artist: string, coverUrl: string) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  addLyric: (text: string) => void;
  setLyricTimestamp: (id: number, timestamp: number | null) => void;
  resetLyrics: () => void;
  identifyAudio: (file: File) => Promise<void>;
  
  setEditableLyrics: (lyrics: string) => void;
  importLyricsToSync: () => void;
  removeLyricTimestamp: (id: number) => void;
  editLyric: (id: number, newText: string) => void;
  seekToTime: (time: number) => void;
  setAudioElement: (element: HTMLAudioElement) => void;
  adjustLyricTimestamp: (id: number, adjustment: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  file: null,
  title: '',
  artist: '',
  coverUrl: '',
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  lyrics: [],
  geniusLyrics: null,
  editableLyrics: '',
  audioElement: null,
  
  setFile: async (file) => {
    const audioElement = new Audio(URL.createObjectURL(file));
    await new Promise((resolve) => {
      audioElement.onloadedmetadata = () => {
        set({ 
          file,
          duration: audioElement.duration,
          audioElement
        });
        resolve(null);
      };
    });

    try {
      const metadata = await musicMetadata.parseBlob(file);
      const title = metadata.common.title || file.name;
      const artist = metadata.common.artist || 'Unknown Artist';
      const picture = metadata.common.picture?.[0];
      
      let coverUrl = '';
      if (picture) {
        const blob = new Blob([picture.data], { type: picture.format });
        coverUrl = URL.createObjectURL(blob);
      }

      set({ title, artist, coverUrl });
    } catch (error) {
      console.error('Error parsing metadata:', error);
      set({
        title: file.name,
        artist: 'Unknown Artist',
        coverUrl: ''
      });
    }
  },

  setMetadata: (title, artist, coverUrl) => {
    set({ title, artist, coverUrl });
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  addLyric: (text) => {
    set((state) => {
      const timestamp = state.currentTime;
      const newLyric = {
        id: Date.now(),
        text,
        timestamp
      };
      
      const newLyrics = [...state.lyrics, newLyric];
      
      return { lyrics: newLyrics };
    });
  },

  setLyricTimestamp: (id, timestamp) => {
    set((state) => ({
      lyrics: state.lyrics.map(lyric =>
        lyric.id === id ? { ...lyric, timestamp } : lyric
      )
    }));
  },

  resetLyrics: () => {
    set({ lyrics: [] });
  },

  identifyAudio: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_token', '99045a682f27e0c047148fb382e97c5a');
    formData.append('return', 'apple_music,spotify');
    
    try {
      const response = await fetch('https://api.audd.io/', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.result) {
        const coverUrl = data.result.spotify?.album?.images?.[0]?.url || 
                      data.result.apple_music?.artwork?.url?.replace('{w}x{h}', '500x500') ||
                      data.result.album_art ||
                      '';

        const title = data.result.title || file.name;
        const artist = data.result.artist || 'Unknown Artist';

        set({
          title,
          artist,
          coverUrl
        });
      } else {
        set({
          title: file.name,
          artist: 'Unknown Artist',
          coverUrl: '/cover-1.png'
        });
      }
    } catch (error) {
      console.error('Error identifying audio:', error);
      set({
        title: file.name,
        artist: 'Unknown Artist',
        coverUrl: '/cover-1.png'
      });
    }
  },

  setEditableLyrics: (lyrics) => {
    set({ editableLyrics: lyrics });
    setTimeout(() => {
      get().importLyricsToSync();
    }, 500);
  },

  importLyricsToSync: () => {
    const { editableLyrics, lyrics } = get();
    const lines = editableLyrics.split('\n').filter(line => line.trim() !== '');

    // Correspondance stricte par index, pas par texte (chaque ligne reste indépendante)
    const newLyrics = lines.map((line, index) => {
      const existing = lyrics[index];
      if (existing) {
        return {
          ...existing,
          text: line.trim()
        };
      } else {
        return {
          id: Date.now() + index,
          text: line.trim(),
          timestamp: null
        };
      }
    });
    set({ lyrics: newLyrics });
  },

  removeLyricTimestamp: (id) => {
    set((state) => ({
      lyrics: state.lyrics.map(lyric =>
        lyric.id === id ? { ...lyric, timestamp: null } : lyric
      )
    }));
  },

  editLyric: (id, newText) => {
    set((state) => {
      const newLyrics = state.lyrics.map(lyric =>
        lyric.id === id ? { ...lyric, text: newText } : lyric
      );
      return {
        lyrics: newLyrics,
        editableLyrics: newLyrics.map(l => l.text).join('\n')
      };
    });
  },

  seekToTime: (time) => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.currentTime = Math.max(0, Math.min(time, audioElement.duration));
      set({ currentTime: audioElement.currentTime });
    }
  },

  setAudioElement: (element) => {
    set({ audioElement: element });
  },

  adjustLyricTimestamp: (id, adjustment) => {
    set((state) => ({
      lyrics: state.lyrics.map(lyric => {
        if (lyric.id === id && lyric.timestamp !== null) {
          const newTimestamp = Math.max(0, lyric.timestamp + adjustment);
          return { ...lyric, timestamp: newTimestamp };
        }
        return lyric;
      })
    }));
  }
}));