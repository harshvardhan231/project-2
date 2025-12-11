import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { 
  MessageSquare, 
  Phone, 
  BookOpen, 
  Wind, 
  ChevronRight, 
  Sparkles,
  Settings
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/colors";
import { useUser } from "@/providers/UserProvider";
import { useJournal } from "@/providers/JournalProvider";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import type { Mood } from "@/types";

const MOOD_OPTIONS: { emoji: string; label: string; mood: Mood }[] = [
  { emoji: "😔", label: "Rough", mood: "sad" },
  { emoji: "😐", label: "Okay", mood: "calm" },
  { emoji: "🙂", label: "Good", mood: "happy" },
  { emoji: "😊", label: "Great", mood: "excited" },
];

const EMOTION_TAGS = ["Anxious", "Tired", "Sad", "Frustrated", "Grateful", "Hopeful"];

export default function HomeScreen() {
  const { user, hasCompletedOnboarding, isLoading: userLoading } = useUser();
  const { 
    recentEntries, 
    todayCheckin, 
    checkins,
    saveCheckin,
    isLoading: journalLoading 
  } = useJournal();
  
  const [greeting, setGreeting] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!userLoading && !hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [hasCompletedOnboarding, userLoading]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const weeklyReflections = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekCheckins = checkins.filter(c => 
      new Date(c.timestamp) >= oneWeekAgo
    );
    return weekCheckins.length;
  }, [checkins]);

  const journeyDots = useMemo(() => {
    const dots: boolean[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toDateString();
      
      const hasCheckin = checkins.some(c => 
        new Date(c.timestamp).toDateString() === dateStr
      );
      dots.push(hasCheckin);
    }
    return dots;
  }, [checkins]);

  const handleMoodSelect = async (mood: Mood) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    
    setSelectedMood(mood);
    
    await saveCheckin({
      mood,
      thought: "",
      action: undefined,
    });

    setShowExpanded(true);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSaveToJournal = () => {
    router.push({
      pathname: "/(tabs)/journal/new",
      params: { mood: selectedMood, tags: selectedTags.join(",") }
    } as any);
    setShowExpanded(false);
    setSelectedMood(null);
    setSelectedTags([]);
  };

  const handleJustLogMood = () => {
    setShowExpanded(false);
    setSelectedMood(null);
    setSelectedTags([]);
  };

  if (userLoading || journalLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.appTitle}>Breath Happiness</Text>
              <Text style={styles.greeting}>{greeting}, {user?.name || "there"}</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push("/(tabs)/settings" as any)}
            >
              <Settings size={22} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.moodWidget}>
            <Text style={styles.moodTitle}>How are you feeling right now?</Text>
            
            <View style={styles.moodOptions}>
              {MOOD_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.mood}
                  style={[
                    styles.moodOption,
                    selectedMood === option.mood && styles.moodOptionSelected,
                    todayCheckin && styles.moodOptionCompleted,
                  ]}
                  onPress={() => handleMoodSelect(option.mood)}
                  disabled={!!todayCheckin}
                  testID={`mood-${option.mood}`}
                >
                  <Text style={styles.moodEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    selectedMood === option.mood && styles.moodLabelSelected,
                  ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {todayCheckin && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓ Mood logged today</Text>
              </View>
            )}

            {showExpanded && !todayCheckin && (
              <View style={styles.expandedSection}>
                <Text style={styles.expandedTitle}>What&apos;s underneath that?</Text>
                <View style={styles.tagContainer}>
                  {EMOTION_TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagChip,
                        selectedTags.includes(tag) && styles.tagChipSelected,
                      ]}
                      onPress={() => handleTagToggle(tag)}
                    >
                      <Text style={[
                        styles.tagText,
                        selectedTags.includes(tag) && styles.tagTextSelected,
                      ]}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.expandedActions}>
                  <TouchableOpacity 
                    style={styles.saveJournalButton}
                    onPress={handleSaveToJournal}
                  >
                    <BookOpen size={16} color="#fff" />
                    <Text style={styles.saveJournalText}>Save to Journal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.justLogButton}
                    onPress={handleJustLogMood}
                  >
                    <Text style={styles.justLogText}>Just log mood</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!showExpanded && !todayCheckin && (
              <TouchableOpacity 
                style={styles.tellMoreButton}
                onPress={() => selectedMood && setShowExpanded(true)}
                disabled={!selectedMood}
              >
                <Text style={[
                  styles.tellMoreText,
                  !selectedMood && styles.tellMoreTextDisabled,
                ]}>Tell me more ↓</Text>
              </TouchableOpacity>
            )}
          </GlassCard>

          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push("/(tabs)/insights" as any)}
              >
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  style={styles.quickActionGradient}
                >
                  <MessageSquare size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickActionLabel}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push("/(tabs)/insights" as any)}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.quickActionGradient}
                >
                  <Phone size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickActionLabel}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push("/(tabs)/journal/new" as any)}
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={styles.quickActionGradient}
                >
                  <BookOpen size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickActionLabel}>Journal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push("/breathing" as any)}
              >
                <LinearGradient
                  colors={["#06B6D4", "#0891B2"]}
                  style={styles.quickActionGradient}
                >
                  <Wind size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickActionLabel}>Breathe</Text>
              </TouchableOpacity>
            </View>
          </View>

          <GlassCard style={styles.journeyCard}>
            <Text style={styles.journeySectionTitle}>Your Journey</Text>
            <View style={styles.journeyDots}>
              {journeyDots.map((filled, index) => (
                <View
                  key={index}
                  style={[
                    styles.journeyDot,
                    filled && styles.journeyDotFilled,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.journeyText}>
              {weeklyReflections} reflection{weeklyReflections !== 1 ? "s" : ""} this week
            </Text>
            {weeklyReflections === 0 && (
              <Text style={styles.journeySubtext}>
                Your journey continues. Start today!
              </Text>
            )}
          </GlassCard>

          {recentEntries.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent Reflections</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/journal" as any)}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              
              {recentEntries.slice(0, 2).map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => router.push(`/(tabs)/journal/${entry.id}` as any)}
                >
                  <GlassCard style={styles.recentEntry}>
                    <View style={styles.recentEntryContent}>
                      <Text style={styles.recentEntryText} numberOfLines={2}>
                        {entry.text}
                      </Text>
                      <Text style={styles.recentEntryDate}>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.gray} />
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {recentEntries.length === 0 && (
            <GlassCard style={styles.emptyState}>
              <Sparkles size={32} color="#6366F1" />
              <Text style={styles.emptyTitle}>Your first reflection starts here</Text>
              <Text style={styles.emptyText}>
                Try writing about how you&apos;re feeling today, something you&apos;re grateful for, or a moment that mattered.
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push("/(tabs)/journal/new" as any)}
              >
                <Text style={styles.emptyButtonText}>Start writing</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FFFA",
  },
  scrollContent: {
    paddingBottom: Platform.OS === "ios" ? 140 : 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#6366F1",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1A1A1A",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  moodWidget: {
    margin: 20,
    marginTop: 8,
    padding: 20,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 20,
  },
  moodOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  moodOption: {
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    minWidth: 70,
  },
  moodOptionSelected: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    transform: [{ scale: 1.05 }],
  },
  moodOptionCompleted: {
    opacity: 0.5,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  moodLabelSelected: {
    color: "#6366F1",
    fontWeight: "600" as const,
  },
  completedBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 16,
  },
  completedText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  expandedSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#1A1A1A",
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  tagChipSelected: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  tagText: {
    fontSize: 14,
    color: "#1A1A1A",
  },
  tagTextSelected: {
    color: "#fff",
  },
  expandedActions: {
    flexDirection: "row",
    gap: 12,
  },
  saveJournalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveJournalText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  justLogButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  justLogText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  tellMoreButton: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tellMoreText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "500" as const,
  },
  tellMoreTextDisabled: {
    color: "#9CA3AF",
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: {
    alignItems: "center",
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "500" as const,
  },
  journeyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  journeySectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 16,
  },
  journeyDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  journeyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  journeyDotFilled: {
    backgroundColor: "#6366F1",
  },
  journeyText: {
    fontSize: 14,
    color: "#1A1A1A",
    textAlign: "center",
    fontWeight: "500" as const,
  },
  journeySubtext: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "500" as const,
  },
  recentEntry: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
  },
  recentEntryContent: {
    flex: 1,
  },
  recentEntryText: {
    fontSize: 14,
    color: "#1A1A1A",
    lineHeight: 20,
    marginBottom: 4,
  },
  recentEntryDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyState: {
    margin: 20,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
