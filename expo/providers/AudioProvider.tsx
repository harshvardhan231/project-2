import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

const MUSIC_ENABLED_KEY = "@calmreflect:music_enabled";

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration?: number;
}

const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "calm-1",
    name: "Peaceful Rain",
    url: "https://www.soundjay.com/misc/sounds/rain-01.wav",
  },
  {
    id: "calm-2",
    name: "Ocean Waves",
    url: "https://www.soundjay.com/misc/sounds/ocean-wave-1.wav",
  },
  {
    id: "calm-3",
    name: "Forest Sounds",
    url: "https://www.soundjay.com/nature/sounds/forest-1.wav",
  },
  {
    id: "calm-4",
    name: "Meditation Bell",
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
  },
];

export const [AudioProvider, useAudio] = createContextHook(() => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicEnabled, setIsMusicEnabledState] = useState(true);
  const [currentTrack, setCurrentTrack] = useState("calm-1");
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadMusicPreference();
  }, []);

  const loadMusicPreference = async () => {
    try {
      const enabled = await AsyncStorage.getItem(MUSIC_ENABLED_KEY);
      if (enabled !== null) {
        setIsMusicEnabledState(enabled === "true");
      }
    } catch (error) {
      console.error("Error loading music preference:", error);
    }
  };

  const setMusicEnabled = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(MUSIC_ENABLED_KEY, enabled.toString());
      setIsMusicEnabledState(enabled);
      if (!enabled) {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error saving music preference:", error);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Initialize web audio
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
      }
    }
  }, [volume]);

  useEffect(() => {
    if (Platform.OS === 'web' && audioRef.current) {
      const track = AUDIO_TRACKS.find(t => t.id === currentTrack);
      if (track) {
        audioRef.current.src = track.url;
        audioRef.current.load(); // Ensure the audio is loaded
        if (isPlaying && isMusicEnabled) {
          audioRef.current.play().catch((error) => {
            console.log('Audio play failed:', error);
            // Fallback: show message that audio requires user interaction
          });
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, currentTrack, isMusicEnabled]);

  useEffect(() => {
    if (Platform.OS === 'web' && audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMusic = useCallback(() => {
    if (isMusicEnabled) {
      setIsPlaying(!isPlaying);
    }
  }, [isMusicEnabled, isPlaying]);

  const playTrack = useCallback((trackId: string) => {
    if (isMusicEnabled) {
      setCurrentTrack(trackId);
      setIsPlaying(true);
    }
  }, [isMusicEnabled]);

  const stopMusic = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const setVolumeLevel = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  }, []);

  return useMemo(() => ({
    isPlaying,
    isMusicEnabled,
    setMusicEnabled,
    currentTrack,
    volume,
    tracks: AUDIO_TRACKS,
    toggleMusic,
    playTrack,
    stopMusic,
    setVolumeLevel,
  }), [
    isPlaying,
    isMusicEnabled,
    setMusicEnabled,
    currentTrack,
    volume,
    toggleMusic,
    playTrack,
    stopMusic,
    setVolumeLevel,
  ]);
});