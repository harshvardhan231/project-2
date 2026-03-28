import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { BreathingAnimation } from "@/components/BreathingAnimation";
import { useAnalytics } from "@/providers/AnalyticsProvider";

export default function BreathingScreen() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes default
  const [selectedDuration, setSelectedDuration] = useState(120);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  
  const { trackBreathingExerciseStarted, trackBreathingExerciseCompleted } = useAnalytics();
  
  const durations = [
    { label: "2 min", value: 120 },
    { label: "3 min", value: 180 },
    { label: "5 min", value: 300 },
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      trackBreathingExerciseCompleted(selectedDuration);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, selectedDuration, trackBreathingExerciseCompleted]);

  useEffect(() => {
    let phaseInterval: ReturnType<typeof setInterval>;
    
    if (isActive) {
      phaseInterval = setInterval(() => {
        setPhase(current => {
          if (current === "inhale") return "hold";
          if (current === "hold") return "exhale";
          return "inhale";
        });
      }, 4000); // 4 seconds per phase
    }
    
    return () => clearInterval(phaseInterval);
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
    trackBreathingExerciseStarted(selectedDuration);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(selectedDuration);
    setPhase("inhale");
  };

  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration);
    setTimeLeft(duration);
    setIsActive(false);
    setPhase("inhale");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPhaseText = () => {
    switch (phase) {
      case "inhale":
        return "Breathe In";
      case "hold":
        return "Hold";
      case "exhale":
        return "Breathe Out";
      default:
        return "Breathe";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#F0F8FF", "#FFF0F5", "#E6E6FA"]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calm Garden</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Breathing Exercise</Text>
          <Text style={styles.subtitle}>
            Find your center with guided breathing
          </Text>

          {/* Duration Selection */}
          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Duration</Text>
            <View style={styles.durationButtons}>
              {durations.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  style={[
                    styles.durationButton,
                    selectedDuration === duration.value && styles.durationButtonActive,
                  ]}
                  onPress={() => handleDurationChange(duration.value)}
                  disabled={isActive}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      selectedDuration === duration.value && styles.durationButtonTextActive,
                    ]}
                  >
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Breathing Animation */}
          <View style={styles.animationContainer}>
            <BreathingAnimation isActive={isActive} phase={phase} />
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
          </View>

          {/* Timer */}
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

          {/* Controls */}
          <View style={styles.controls}>
            {!isActive ? (
              <TouchableOpacity
                style={styles.playButton}
                onPress={handleStart}
                disabled={timeLeft === 0}
              >
                <Play size={24} color={colors.white} />
                <Text style={styles.playButtonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={handlePause}
              >
                <Pause size={24} color={colors.white} />
                <Text style={styles.pauseButtonText}>Pause</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <RotateCcw size={20} color={colors.primary} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>How it works:</Text>
            <Text style={styles.instructionsText}>
              • Follow the circle as it expands and contracts{"\n"}
              • Breathe in as it grows, hold, then breathe out{"\n"}
              • Focus on your breath and let go of distractions
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  durationContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 12,
  },
  durationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  durationButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
  },
  durationButtonTextActive: {
    color: colors.white,
  },
  animationContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  phaseText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
    marginTop: 20,
  },
  timer: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 30,
  },
  controls: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
  },
  playButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  pauseButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pauseButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  resetButton: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  instructions: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 20,
    borderRadius: 16,
    width: "100%",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
