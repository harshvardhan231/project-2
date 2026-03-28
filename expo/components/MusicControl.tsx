import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Play, Pause, Volume2, VolumeX } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAudio } from "@/providers/AudioProvider";

export function MusicControl() {
  const { 
    isPlaying, 
    isMusicEnabled, 
    currentTrack, 
    tracks, 
    toggleMusic, 
    playTrack, 
    setMusicEnabled 
  } = useAudio();

  const currentTrackInfo = tracks.find(t => t.id === currentTrack);

  if (!isMusicEnabled) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.enableButton}
          onPress={() => setMusicEnabled(true)}
        >
          <VolumeX size={16} color={colors.textSecondary} />
          <Text style={styles.enableText}>Enable Music</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Volume2 size={16} color={colors.primary} />
        <Text style={styles.title}>Background Music</Text>
        <TouchableOpacity onPress={() => setMusicEnabled(false)}>
          <VolumeX size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.currentTrack}>
        <Text style={styles.trackName}>{currentTrackInfo?.name || "No track"}</Text>
        <TouchableOpacity style={styles.playButton} onPress={toggleMusic}>
          {isPlaying ? (
            <Pause size={16} color={colors.white} />
          ) : (
            <Play size={16} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trackList}>
        {tracks.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={[
              styles.trackItem,
              currentTrack === track.id && styles.trackItemActive,
            ]}
            onPress={() => playTrack(track.id)}
          >
            <Text style={[
              styles.trackItemText,
              currentTrack === track.id && styles.trackItemTextActive,
            ]}>
              {track.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
    marginLeft: 8,
  },
  currentTrack: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  trackName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  trackList: {
    flexDirection: "row",
  },
  trackItem: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  trackItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  trackItemText: {
    fontSize: 12,
    color: colors.text,
  },
  trackItemTextActive: {
    color: colors.white,
  },
  enableButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  enableText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
});