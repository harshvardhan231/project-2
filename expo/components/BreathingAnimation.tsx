import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface BreathingAnimationProps {
  onComplete?: () => void;
  isActive?: boolean;
  phase?: "inhale" | "hold" | "exhale";
}

const { height } = Dimensions.get("window");

export function BreathingAnimation({ onComplete, isActive, phase }: BreathingAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const [currentPhase, setCurrentPhase] = useState<"in" | "hold" | "out">("in");
  const [isSkipped, setIsSkipped] = useState(false);
  useEffect(() => {
    startBreathingSequence();
  }, []);

  const playVoice = async (text: string) => {
    if (Platform.OS === 'web') {
      // Use Web Speech API for web
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.7;
        speechSynthesis.speak(utterance);
      }
    } else {
      // For mobile, we'll use text-to-speech or just skip voice for now
      console.log(`Voice: ${text}`);
    }
  };

  const startBreathingSequence = () => {
    if (isSkipped) return;

    // Fade in the circle
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(textOpacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Start the breathing cycle
    setTimeout(() => {
      if (!isSkipped) {
        breatheIn();
      }
    }, 1000);
  };

  const breatheIn = () => {
    if (isSkipped) return;
    setCurrentPhase("in");
    playVoice("Breathe In");
    
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: true,
    }).start(() => {
      if (!isSkipped) {
        setTimeout(() => hold(), 500);
      }
    });
  };

  const hold = () => {
    if (isSkipped) return;
    setCurrentPhase("hold");
    setTimeout(() => {
      if (!isSkipped) {
        breatheOut();
      }
    }, 2000);
  };

  const breatheOut = () => {
    if (isSkipped) return;
    setCurrentPhase("out");
    playVoice("Breathe Out");
    
    Animated.timing(scaleAnim, {
      toValue: 0.3,
      duration: 6000,
      useNativeDriver: true,
    }).start(() => {
      if (!isSkipped && onComplete) {
        setTimeout(() => onComplete(), 500);
      }
    });
  };

  const handleSkip = () => {
    setIsSkipped(true);
    if (onComplete) onComplete();
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case "in":
        return "Breathe In";
      case "hold":
        return "Hold";
      case "out":
        return "Breathe Out";
      default:
        return "";
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E6E6FA", "#B0E0E6", "#F5FFFA", "#FFDAB9"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.circle,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.8)", "rgba(255,255,255,0.4)"]}
              style={styles.circleGradient}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              { opacity: textOpacityAnim },
            ]}
          >
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
          </Animated.View>
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
  },
  circleGradient: {
    flex: 1,
    borderRadius: 100,
  },
  textContainer: {
    position: "absolute",
    bottom: height * 0.3,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skipButton: {
    position: "absolute",
    bottom: 50,
    right: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: "#1A1A1A",
    opacity: 0.7,
  },
});