import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Mood } from "@/types";

interface MoodEmojiProps {
  mood: Mood;
  size?: number;
}

export function MoodEmoji({ mood, size = 32 }: MoodEmojiProps) {
  const getEmoji = () => {
    switch (mood) {
      case "happy":
        return "😊";
      case "calm":
        return "😌";
      case "anxious":
        return "😰";
      case "sad":
        return "😢";
      case "angry":
        return "😠";
      case "excited":
        return "🤗";
      default:
        return "😐";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.emoji, { fontSize: size }]}>{getEmoji()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 32,
  },
});