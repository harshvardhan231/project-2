import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { X, ChevronRight, ChevronLeft } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { MoodSelector } from "@/components/MoodSelector";
import { useJournal } from "@/providers/JournalProvider";
import { detectCrisis } from "@/utils/crisis";
import { Mood } from "@/types";

const STEPS = ["mood", "thought", "action"] as const;
type Step = typeof STEPS[number];

export default function CheckinScreen() {
  const [currentStep, setCurrentStep] = useState<Step>("mood");
  const [mood, setMood] = useState<Mood | null>(null);
  const [thought, setThought] = useState("");
  const [action, setAction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveCheckin } = useJournal();

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!mood || !thought) {
      Alert.alert("Incomplete", "Please complete all questions");
      return;
    }

    const fullText = `${thought} ${action}`;
    if (detectCrisis(fullText)) {
      router.push("/crisis");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveCheckin({
        mood,
        thought,
        action,
      });
      
      router.push("/(tabs)/(home)/home" as any);
    } catch (error) {
      console.error("Error saving checkin:", error);
      Alert.alert("Error", "Failed to save check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "mood":
        return mood !== null;
      case "thought":
        return thought.trim().length > 0;
      case "action":
        return true;
      default:
        return false;
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case "mood":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>How are you feeling right now?</Text>
            <MoodSelector
              selectedMood={mood}
              onSelectMood={setMood}
            />
          </View>
        );
      case "thought":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>What&apos;s on your mind?</Text>
            <Text style={styles.hint}>Share a brief thought or feeling</Text>
            <TextInput
              style={styles.textInput}
              placeholder="I&apos;m thinking about..."
              value={thought}
              onChangeText={setThought}
              multiline
              maxLength={200}
              autoFocus
              testID="thought-input"
            />
            <Text style={styles.charCount}>{thought.length}/200</Text>
          </View>
        );
      case "action":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>One small thing you&apos;ll do today?</Text>
            <Text style={styles.hint}>A simple action to support your wellbeing</Text>
            <TextInput
              style={styles.textInput}
              placeholder="I will..."
              value={action}
              onChangeText={setAction}
              multiline
              maxLength={100}
              autoFocus
              testID="action-input"
            />
            <Text style={styles.charCount}>{action.length}/100</Text>
          </View>
        );
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
        <View style={styles.progress}>
          {STEPS.map((step, index) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                index <= STEPS.indexOf(currentStep) && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {getStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep !== "mood" && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <ChevronLeft size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {currentStep !== "action" ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed() && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={20} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Complete Check-in</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
  },
  closeButton: {
    padding: 8,
  },
  progress: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
    justifyContent: "center",
  },
  question: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "right",
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 120 : 100,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginLeft: "auto",
  },
  nextButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600" as const,
    marginRight: 4,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    marginLeft: 60,
  },
  submitButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600" as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});