import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flower2, Heart, Sparkles, Volume2, VolumeX } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAudio } from "@/providers/AudioProvider";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

interface Flower {
  id: string;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
}

export default function GardenScreen() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const breathAnimation = useRef(new Animated.Value(1)).current;
  const { isPlaying: isMusicPlaying, toggleMusic } = useAudio();

  useEffect(() => {
    if (isPlaying) {
      startBreathingAnimation();
    }
  }, [isPlaying]);

  const startBreathingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnimation, {
          toValue: 1.2,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnimation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        plantFlower(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (Math.random() > 0.7) {
          plantFlower(locationX, locationY);
        }
      },
    })
  ).current;

  const plantFlower = (x: number, y: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newFlower: Flower = {
      id: Date.now().toString() + Math.random(),
      x,
      y,
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: [colors.primary, colors.green, colors.secondary, "#FF6B6B", "#4ECDC4"][
        Math.floor(Math.random() * 5)
      ],
    };

    setFlowers(prev => [...prev, newFlower]);
    setScore(prev => prev + 1);

    Animated.parallel([
      Animated.spring(newFlower.scale, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(newFlower.opacity, {
        toValue: 0.8,
        duration: 5000,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setFlowers(prev => prev.filter(f => f.id !== newFlower.id));
    }, 10000);
  };

  const handleStart = () => {
    setIsPlaying(true);
    setFlowers([]);
    setScore(0);
  };

  const handleEnd = () => {
    setIsPlaying(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#87CEEB", "#98FB98", "#F0E68C"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {!isPlaying ? (
          <View style={styles.startScreen}>
            <Flower2 size={64} color={colors.white} />
            <Text style={styles.title}>Calm Garden</Text>
            <Text style={styles.subtitle}>
              Plant flowers with your touch and watch your garden grow
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
            >
              <Text style={styles.startButtonText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.scoreContainer}>
                <Sparkles size={20} color={colors.white} />
                <Text style={styles.scoreText}>{score} flowers</Text>
              </View>
              <TouchableOpacity
                style={styles.soundButton}
                onPress={toggleMusic}
              >
                {isMusicPlaying ? (
                  <Volume2 size={24} color={colors.white} />
                ) : (
                  <VolumeX size={24} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.garden} {...panResponder.panHandlers}>
              <Animated.View
                style={[
                  styles.breathingCircle,
                  { transform: [{ scale: breathAnimation }] },
                ]}
              >
                <Text style={styles.breathText}>Breathe</Text>
              </Animated.View>

              {flowers.map(flower => (
                <Animated.View
                  key={flower.id}
                  style={[
                    styles.flower,
                    {
                      left: flower.x - 15,
                      top: flower.y - 15,
                      transform: [{ scale: flower.scale }],
                      opacity: flower.opacity,
                    },
                  ]}
                >
                  <Flower2 size={30} color={flower.color} />
                </Animated.View>
              ))}

              <Text style={styles.instruction}>Touch anywhere to plant</Text>
            </View>

            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEnd}
            >
              <Text style={styles.endButtonText}>End Session</Text>
            </TouchableOpacity>
          </>
        )}
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
  startScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.white,
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.9,
  },
  startButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.white,
    marginLeft: 8,
  },
  soundButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 10,
    borderRadius: 20,
  },
  garden: {
    flex: 1,
    position: "relative",
  },
  breathingCircle: {
    position: "absolute",
    top: "40%",
    left: "50%",
    marginLeft: -60,
    marginTop: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  breathText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: "600" as const,
  },
  flower: {
    position: "absolute",
  },
  instruction: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 14,
    color: colors.white,
    opacity: 0.7,
  },
  endButton: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.primary,
  },
});