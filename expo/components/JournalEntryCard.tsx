import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";
import { JournalEntry } from "@/types";
import { MoodEmoji } from "./MoodEmoji";
import { Calendar, Tag } from "lucide-react-native";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
}

export function JournalEntryCard({ entry, onPress }: JournalEntryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      });
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <MoodEmoji mood={entry.mood} size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
          <Text style={styles.mood}>{entry.mood}</Text>
        </View>
      </View>
      
      <Text style={styles.text} numberOfLines={3}>
        {entry.text}
      </Text>
      
      {entry.tags.length > 0 && (
        <View style={styles.tags}>
          {entry.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Tag size={10} color={colors.primary} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {entry.tags.length > 3 && (
            <Text style={styles.moreTags}>+{entry.tags.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerInfo: {
    marginLeft: 12,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  mood: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.text,
    textTransform: "capitalize" as const,
  },
  text: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: colors.primary,
    marginLeft: 4,
  },
  moreTags: {
    fontSize: 11,
    color: colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});