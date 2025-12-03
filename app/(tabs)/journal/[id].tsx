import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Trash2, Edit, Share2 } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useJournal } from "@/providers/JournalProvider";
import { MoodEmoji } from "@/components/MoodEmoji";

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams();
  const { entries, deleteEntry } = useJournal();
  
  const entry = entries.find(e => e.id === id);

  if (!entry) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteEntry(entry.id);
            router.back();
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.moodContainer}>
          <MoodEmoji mood={entry.mood} size={48} />
          <View style={styles.moodInfo}>
            <Text style={styles.moodText}>{entry.mood}</Text>
            <Text style={styles.dateText}>
              {new Date(entry.created_at).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {entry.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {entry.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.entryText}>{entry.text}</Text>
      </View>

      {entry.images && entry.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {entry.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.image}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  moodContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  moodInfo: {
    marginLeft: 16,
  },
  moodText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    textTransform: "capitalize" as const,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    paddingBottom: 0,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500" as const,
  },
  content: {
    padding: 20,
  },
  entryText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  imagesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
});