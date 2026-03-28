import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowLeft, Send, X } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useJournal } from "@/providers/JournalProvider";
import { MoodSelector } from "@/components/MoodSelector";
import { detectCrisis } from "@/utils/crisis";
import { generateCheckinResponse } from "@/utils/ai";
import type { Mood } from "@/types";

type CheckinStep = "mood" | "thought" | "action" | "response";

export default function CheckinScreen() {
  const { saveCheckin } = useJournal();
  const [step, setStep] = useState<CheckinStep>("mood");
  const [mood, setMood] = useState<Mood | null>(null);
  const [thought, setThought] = useState("");
  const [action, setAction] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (step === "response") {
      generateResponse();
    }
  }, [step]);

  const generateResponse = async () => {
    if (!mood || !thought) return;

    setIsLoading(true);
    try {
      const isCrisis = detectCrisis(thought);
      if (isCrisis) {
        router.push("/crisis");
        return;
      }

      const response = await generateCheckinResponse(mood, thought);
      setAiResponse(response);
    } catch (error) {
      console.error("Error generating AI response:", error);
      setAiResponse("Thank you for sharing. Remember to be kind to yourself today.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!mood) return;

    try {
      await saveCheckin({
        mood,
        thought,
        action,
      });
      router.replace("/(tabs)/(home)" as any);
    } catch (err) {
      Alert.alert("Error", "Failed to save check-in. Please try again.");
    }
  };

  const handleClose = () => {
    router.back();
  };

  const renderMoodStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How are you feeling right now?</Text>
      <MoodSelector
        selectedMood={mood}
        onSelectMood={(selectedMood) => {
          setMood(selectedMood);
          setStep("thought");
        }}
      />
    </View>
  );

  const renderThoughtStep = () => (
    <KeyboardAvoidingView 
      style={styles.stepContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.thoughtScrollContent}>
        <Text style={styles.stepTitle}>What&apos;s on your mind?</Text>
        <Text style={styles.stepSubtitle}>Share a quick thought or feeling</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type your thoughts here..."
          placeholderTextColor={colors.gray}
          value={thought}
          onChangeText={setThought}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoFocus
        />
        {thought.trim() && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setStep("action")}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderActionStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.actionScrollContent}>
      <Text style={styles.stepTitle}>One small action for today?</Text>
      <Text style={styles.stepSubtitle}>Something simple you can do</Text>
      <View style={styles.actionOptions}>
        {[
          "Take 5 deep breaths",
          "Go for a short walk",
          "Call a friend",
          "Write in journal",
          "Listen to music",
        ].map((actionOption) => (
          <TouchableOpacity
            key={actionOption}
            style={[
              styles.actionOption,
              action === actionOption && styles.actionOptionSelected,
            ]}
            onPress={() => setAction(actionOption)}
          >
            <Text
              style={[
                styles.actionOptionText,
                action === actionOption && styles.actionOptionTextSelected,
              ]}
            >
              {actionOption}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => setStep("response")}
      >
        <Text style={styles.nextButtonText}>Get AI Response</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderResponseStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.responseScrollContent}>
      <Text style={styles.stepTitle}>Your personalized insight</Text>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Generating your insight...</Text>
        </View>
      ) : (
        <>
          <View style={styles.responseContainer}>
            <Text style={styles.responseText}>{aiResponse}</Text>
          </View>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
          >
            <Send size={20} color={colors.white} />
            <Text style={styles.completeButtonText}>Complete Check-in</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#E6E6FA", "#B0E0E6", "#F5FFFA"]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === "mood") {
                handleClose();
              } else {
                const steps: CheckinStep[] = ["mood", "thought", "action", "response"];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1]);
                }
              }
            }}
          >
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check-in</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    step === "mood"
                      ? "25%"
                      : step === "thought"
                      ? "50%"
                      : step === "action"
                      ? "75%"
                      : "100%",
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.content}>
          {step === "mood" && renderMoodStep()}
          {step === "thought" && renderThoughtStep()}
          {step === "action" && renderActionStep()}
          {step === "response" && renderResponseStep()}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FFFA",
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1A1A1A",
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flex: 1,
  },
  thoughtScrollContent: {
    paddingBottom: 40,
  },
  actionScrollContent: {
    paddingBottom: 40,
  },
  responseScrollContent: {
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: "#1A1A1A",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 20,
  },
  actionOptions: {
    gap: 12,
    marginBottom: 30,
  },
  actionOption: {
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  actionOptionSelected: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  actionOptionText: {
    fontSize: 16,
    color: "#1A1A1A",
    textAlign: "center",
  },
  actionOptionTextSelected: {
    color: "#6366F1",
    fontWeight: "600" as const,
  },
  nextButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 10,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  responseContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  responseText: {
    fontSize: 16,
    color: "#1A1A1A",
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  completeButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});