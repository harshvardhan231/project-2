import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BookOpen, MessageSquare, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@/providers/UserProvider";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2;

export default function LaunchSelector() {
  const insets = useSafeAreaInsets();
  const { user, hasCompletedOnboarding, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [hasCompletedOnboarding, isLoading]);

  const handleSelect = async (destination: "journal" | "reflect") => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (destination === "journal") {
      router.replace("/(tabs)/journal" as any);
    } else {
      router.replace("/(tabs)/insights" as any);
    }
  };

  const handleSkipToHome = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.replace("/(tabs)/(home)" as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return null;
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AuroraBackground>
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <View style={styles.header}>
          <View style={styles.sparkleContainer}>
            <Sparkles size={28} color="#6366F1" />
          </View>
          <Text style={styles.greeting}>
            {getTimeBasedGreeting()}, {user?.name || "there"}
          </Text>
          <Text style={styles.subtitle}>What would you like to do today?</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => handleSelect("journal")}
            activeOpacity={0.8}
            testID="select-journal"
          >
            <GlassCard style={styles.card}>
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                style={styles.iconGradient}
              >
                <BookOpen size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.cardTitle}>Journal</Text>
              <Text style={styles.cardDescription}>
                Write down your thoughts and feelings
              </Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => handleSelect("reflect")}
            activeOpacity={0.8}
            testID="select-reflect"
          >
            <GlassCard style={styles.card}>
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                style={styles.iconGradient}
              >
                <MessageSquare size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.cardTitle}>Reflect</Text>
              <Text style={styles.cardDescription}>
                Chat with your AI companion
              </Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipToHome}
          activeOpacity={0.7}
          testID="skip-to-home"
        >
          <Text style={styles.skipText}>Go to Home</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          You can always access all features from home
        </Text>
      </View>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FFFA",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  sparkleContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    color: "#6B7280",
    textAlign: "center",
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    padding: 24,
    alignItems: "center",
    minHeight: 200,
    justifyContent: "center",
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  skipButton: {
    alignSelf: "center",
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#6366F1",
  },
  footerText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
  },
});
