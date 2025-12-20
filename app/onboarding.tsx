import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Sparkles, ChevronRight, Bell, Mic } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useUser } from "@/providers/UserProvider";
import * as Haptics from "expo-haptics";

const STEPS = ["disclaimer", "value", "name", "permissions", "breathing", "greeting"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<Step>("disclaimer");
  const [name, setName] = useState("");
  const { setUser, setHasCompletedOnboarding } = useUser();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const breatheScale = useRef(new Animated.Value(0.3)).current;
  const breatheOpacity = useRef(new Animated.Value(0)).current;
  const [breathePhase, setBreathePhase] = useState<"in" | "hold" | "out">("in");


  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    animateIn();
  }, [currentStep, animateIn]);

  const handleNext = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === "value") {
      const timer = setTimeout(() => {
        handleNext();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, handleNext]);





  const startBreathingSequence = useCallback(() => {
    Animated.timing(breatheOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setBreathePhase("in");
      playVoice("Breathe In");
      
      Animated.timing(breatheScale, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setBreathePhase("hold");
          setTimeout(() => {
            setBreathePhase("out");
            playVoice("Breathe Out");
            
            Animated.timing(breatheScale, {
              toValue: 0.3,
              duration: 6000,
              useNativeDriver: true,
            }).start(() => {
              setTimeout(() => {
                const currentIndex = STEPS.indexOf("breathing");
                if (currentIndex < STEPS.length - 1) {
                  setCurrentStep(STEPS[currentIndex + 1]);
                }
              }, 500);
            });
          }, 2000);
        }, 500);
      });
    }, 500);
  }, [breatheOpacity, breatheScale]);

  const playVoice = (text: string) => {
    if (Platform.OS === "web" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentStep === "breathing") {
      startBreathingSequence();
    }
  }, [currentStep, startBreathingSequence]);

  const handleSkipBreathing = () => {
    if (Platform.OS === "web") {
      speechSynthesis.cancel();
    }
    handleNext();
  };

  const handleComplete = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    
    if (name.trim()) {
      await setUser({ name: name.trim() });
    }
    await setHasCompletedOnboarding(true);
    router.replace("/(tabs)/(home)/home" as any);
  };

  const handleSkipName = () => {
    handleNext();
  };

  const getPhaseText = () => {
    switch (breathePhase) {
      case "in": return "Breathe In";
      case "hold": return "Hold";
      case "out": return "Breathe Out";
      default: return "";
    }
  };

  const renderValueProp = () => (
    <Animated.View 
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.valueContainer}>
        <Heart size={48} color="#6366F1" />
        <Text style={styles.valueTitle}>Your daily space for{"\n"}calm & reflection</Text>
        <View style={styles.valueFeatures}>
          <Text style={styles.valueFeature}>Talk • Journal • Breathe</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderNameStep = () => (
    <Animated.View 
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Sparkles size={56} color="#6366F1" />
      <Text style={styles.title}>What should I call you?</Text>
      <Text style={styles.subtitle}>This helps personalize your experience</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor={colors.gray}
        value={name}
        onChangeText={setName}
        autoFocus
        testID="name-input"
      />
      <TouchableOpacity
        style={[styles.primaryButton, !name.trim() && styles.buttonMuted]}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>
          {name.trim() ? "Continue" : "Continue"}
        </Text>
        <ChevronRight size={20} color={colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipLink} onPress={handleSkipName}>
        <Text style={styles.skipLinkText}>Skip for now</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPermissionsStep = () => (
    <Animated.View 
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Text style={styles.title}>To make this work better</Text>
      
      <View style={styles.permissionCard}>
        <View style={styles.permissionIcon}>
          <Bell size={24} color="#6366F1" />
        </View>
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionTitle}>Notifications</Text>
          <Text style={styles.permissionDesc}>Get gentle daily reminders</Text>
        </View>
        <TouchableOpacity style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Allow</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.permissionCard}>
        <View style={styles.permissionIcon}>
          <Mic size={24} color="#6366F1" />
        </View>
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionTitle}>Microphone (optional)</Text>
          <Text style={styles.permissionDesc}>For voice conversations</Text>
        </View>
        <TouchableOpacity style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Allow</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Continue</Text>
        <ChevronRight size={20} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBreathingStep = () => (
    <View style={styles.breathingContainer}>
      <Text style={styles.breathingIntro}>Let&apos;s start with a moment of calm...</Text>
      
      <View style={styles.breathingCircleContainer}>
        <Animated.View
          style={[
            styles.breathingCircle,
            {
              transform: [{ scale: breatheScale }],
              opacity: breatheOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={["#818CF8", "#6366F1", "#4F46E5"]}
            style={styles.breathingGradient}
          />
        </Animated.View>
      </View>

      <Animated.Text style={[styles.breathePhaseText, { opacity: breatheOpacity }]}>
        {getPhaseText()}
      </Animated.Text>

      <TouchableOpacity style={styles.skipBreathingButton} onPress={handleSkipBreathing}>
        <Text style={styles.skipBreathingText}>Skip ↓</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGreetingStep = () => (
    <Animated.View 
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.greetingBubble}>
        <View style={styles.aiAvatar}>
          <Sparkles size={24} color={colors.white} />
        </View>
        <View style={styles.greetingContent}>
          <Text style={styles.greetingText}>
            Hey {name || "there"}, I&apos;m here to listen whenever you need. How&apos;s your day going?
          </Text>
        </View>
      </View>

      <View style={styles.quickReplies}>
        <TouchableOpacity 
          style={styles.quickReplyChip}
          onPress={handleComplete}
        >
          <Text style={styles.quickReplyEmoji}>😔</Text>
          <Text style={styles.quickReplyText}>Rough</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickReplyChip}
          onPress={handleComplete}
        >
          <Text style={styles.quickReplyEmoji}>😐</Text>
          <Text style={styles.quickReplyText}>Okay</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickReplyChip}
          onPress={handleComplete}
        >
          <Text style={styles.quickReplyEmoji}>🙂</Text>
          <Text style={styles.quickReplyText}>Good</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleComplete}>
        <Text style={styles.startButtonText}>Start Using Breath Happiness</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDisclaimerStep = () => (
    <Animated.View 
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.disclaimerContainer}>
        <View style={styles.disclaimerHeader}>
          <Heart size={32} color="#6366F1" />
          <Text style={styles.disclaimerTitle}>Before We Begin</Text>
        </View>
        
        <View style={styles.disclaimerScrollContainer}>
          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerSectionTitle}>1. Professional Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              This platform is an AI-driven tool designed for informational and educational purposes only. It does not provide medical, clinical, or professional health advice. Use of this service does not establish a provider-patient relationship. Please consult a qualified professional before making any health-related decisions.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerSectionTitle}>2. Emergency Protocol</Text>
            <Text style={styles.disclaimerText}>
              This service is not monitored for emergencies and is not equipped to handle mental health crises or life-threatening situations. If you are in immediate danger or experiencing a crisis, please contact your local emergency services (such as 911 or 112) or a certified crisis hotline immediately.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerSectionTitle}>3. Age Requirements</Text>
            <Text style={styles.disclaimerText}>
              Access to this service is strictly limited to individuals aged 18 and older. By continuing, you certify that you meet this age requirement and possess the legal capacity to agree to these terms.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerSectionTitle}>4. Nature of AI (Beta Status)</Text>
            <Text style={styles.disclaimerText}>
              This software utilizes experimental AI technology and is currently a work in progress. While we strive for accuracy, the system may occasionally produce incorrect, biased, or inconsistent information.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerSectionTitle}>5. Acknowledgment of Terms</Text>
            <Text style={styles.disclaimerText}>
              By selecting the button below, you acknowledge that you have read, understood, and agreed to the terms outlined above, and our Privacy Policy.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.disclaimerButton}
          onPress={handleNext}
        >
          <Text style={styles.disclaimerButtonText}>I Understand</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case "disclaimer": return renderDisclaimerStep();
      case "value": return renderValueProp();
      case "name": return renderNameStep();
      case "permissions": return renderPermissionsStep();
      case "breathing": return renderBreathingStep();
      case "greeting": return renderGreetingStep();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        // Happier colors to match app theme
        colors={["#F0F8FF", "#FFF0F5", "#E6E6FA"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {currentStep !== "value" && currentStep !== "breathing" && currentStep !== "disclaimer" && (
          <View style={styles.progress}>
            {STEPS.filter(s => s !== "value").map((step, index) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  STEPS.indexOf(currentStep) >= STEPS.indexOf(step) && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        )}

        {getStepContent()}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  disclaimerContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 8,
  },
  disclaimerHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    marginTop: 12,
  },
  disclaimerScrollContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  disclaimerSection: {
    marginBottom: 16,
  },
  disclaimerSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6366F1",
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 13,
    color: "#4A4A4A",
    lineHeight: 20,
  },
  disclaimerButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  disclaimerButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressDotActive: {
    backgroundColor: "#6366F1",
    width: 24,
  },
  stepContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  valueContainer: {
    alignItems: "center",
  },
  valueTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    marginTop: 24,
    textAlign: "center",
    lineHeight: 42,
  },
  valueFeatures: {
    marginTop: 20,
  },
  valueFeature: {
    fontSize: 18,
    color: "#6366F1",
    fontWeight: "500" as const,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 24,
    color: "#1A1A1A",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 8,
  },
  buttonMuted: {
    backgroundColor: "#6366F1",
    opacity: 0.8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.white,
    marginRight: 8,
  },
  skipLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  skipLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: "100%",
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1A1A",
  },
  permissionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  permissionButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  breathingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  breathingIntro: {
    fontSize: 20,
    fontWeight: "500" as const,
    color: "#1A1A1A",
    marginBottom: 40,
    textAlign: "center",
  },
  breathingCircleContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  breathingGradient: {
    flex: 1,
    borderRadius: 100,
  },
  breathePhaseText: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginTop: 40,
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skipBreathingButton: {
    position: "absolute",
    bottom: 50,
    right: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipBreathingText: {
    fontSize: 16,
    color: "#1A1A1A",
    opacity: 0.7,
  },
  greetingBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 32,
    width: "100%",
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  greetingContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: "#1A1A1A",
    lineHeight: 24,
  },
  quickReplies: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  quickReplyChip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  quickReplyEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickReplyText: {
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "500" as const,
  },
  startButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.white,
  },
});