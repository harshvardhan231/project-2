import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { X, Camera, Tag as TagIcon, Save } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { MoodSelector } from "@/components/MoodSelector";
import { useJournal } from "@/providers/JournalProvider";
import { detectCrisis } from "@/utils/crisis";
import { Mood } from "@/types";

const SUGGESTED_TAGS = ["work", "family", "health", "personal", "goals", "gratitude"];

export default function NewJournalEntry() {
  const { prefilledText } = useLocalSearchParams<{ prefilledText?: string }>();
  const [mood, setMood] = useState<Mood | null>(null);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveEntry } = useJournal();

  useEffect(() => {
    if (prefilledText) {
      setText(prefilledText);
    }
  }, [prefilledText]);

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImages([...images, base64]);
    }
  };

  const handleSave = async () => {
    if (!mood || !text.trim()) {
      Alert.alert("Incomplete Entry", "Please select a mood and write something");
      return;
    }

    if (detectCrisis(text)) {
      router.push("/crisis");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveEntry({
        mood,
        text,
        tags,
        images,
      });
      
      router.back();
    } catch (error) {
      console.error("Error saving entry:", error);
      Alert.alert("Error", "Failed to save entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Entry</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Save size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <MoodSelector
            selectedMood={mood}
            onSelectMood={setMood}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Write your thoughts here..."
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            testID="journal-text-input"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsGrid}>
            {SUGGESTED_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  tags.includes(tag) && styles.tagChipActive,
                ]}
                onPress={() => 
                  tags.includes(tag) ? handleRemoveTag(tag) : handleAddTag(tag)
                }
              >
                <Text style={[
                  styles.tagText,
                  tags.includes(tag) && styles.tagTextActive,
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.customTagContainer}>
            <TextInput
              style={styles.customTagInput}
              placeholder="Add custom tag..."
              value={customTag}
              onChangeText={setCustomTag}
              onSubmitEditing={handleAddCustomTag}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={handleAddCustomTag}
            >
              <TagIcon size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <X size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 3 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handlePickImage}
              >
                <Camera size={24} color={colors.gray} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
  },
  saveButton: {
    padding: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 120 : 100,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 14,
    color: colors.text,
  },
  tagTextActive: {
    color: colors.white,
  },
  customTagContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  customTagInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  addTagButton: {
    marginLeft: 12,
    padding: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.text,
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: "dashed" as const,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
});