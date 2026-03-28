import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Mood } from "@/types";
import { colors } from "@/constants/colors";
import { MoodEmoji } from "./MoodEmoji";

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood) => void;
}

const MOODS: { mood: Mood; label: string }[] = [
  { mood: "happy", label: "Happy" },
  { mood: "calm", label: "Calm" },
  { mood: "excited", label: "Excited" },
  { mood: "anxious", label: "Anxious" },
  { mood: "sad", label: "Sad" },
  { mood: "angry", label: "Angry" },
];

export function MoodSelector({ selectedMood, onSelectMood }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      {MOODS.map(({ mood, label }) => (
        <TouchableOpacity
          key={mood}
          style={[
            styles.moodButton,
            selectedMood === mood && styles.moodButtonSelected,
          ]}
          onPress={() => onSelectMood(mood)}
        >
          <MoodEmoji mood={mood} size={40} />
          <Text style={[
            styles.moodLabel,
            selectedMood === mood && styles.moodLabelSelected,
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
  },
  moodButton: {
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    minWidth: 100,
  },
  moodButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  moodLabel: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text,
  },
  moodLabelSelected: {
    fontWeight: "600" as const,
    color: colors.primary,
  },
});