import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, TrendingUp, Target, RefreshCw } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useJournal } from "@/providers/JournalProvider";
import { generateSummary } from "@/utils/ai";

export default function SummaryScreen() {
  const { recentEntries } = useJournal();
  const [summary, setSummary] = useState<string>("");
  const [themes, setThemes] = useState<string[]>([]);
  const [action, setAction] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSummary = async () => {
    if (recentEntries.length === 0) {
      setSummary("Start journaling to see your personalized insights.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await generateSummary(recentEntries.slice(0, 7));
      setSummary(result.summary);
      setThemes(result.themes);
      setAction(result.action);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary("Unable to generate summary. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSummary();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating your insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <LinearGradient
        colors={[colors.primaryLight, colors.white]}
        style={styles.headerCard}
      >
        <Sparkles size={32} color={colors.primary} />
        <Text style={styles.headerTitle}>Your Weekly Reflection</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString("en-US", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </Text>
      </LinearGradient>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>

      {themes.length > 0 && (
        <View style={styles.themesCard}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Recurring Themes</Text>
          </View>
          {themes.map((theme, index) => (
            <View key={index} style={styles.themeItem}>
              <View style={styles.themeDot} />
              <Text style={styles.themeText}>{theme}</Text>
            </View>
          ))}
        </View>
      )}

      {action && (
        <View style={styles.actionCard}>
          <LinearGradient
            colors={[colors.green + "20", colors.white]}
            style={styles.actionGradient}
          >
            <View style={styles.sectionHeader}>
              <Target size={20} color={colors.green} />
              <Text style={styles.sectionTitle}>Your Action for This Week</Text>
            </View>
            <Text style={styles.actionText}>{action}</Text>
          </LinearGradient>
        </View>
      )}

      <TouchableOpacity
        style={styles.regenerateButton}
        onPress={handleRefresh}
      >
        <RefreshCw size={18} color={colors.primary} />
        <Text style={styles.regenerateText}>Regenerate Summary</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  headerDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  themesCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  themeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  themeText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  actionCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  actionGradient: {
    padding: 20,
  },
  actionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    fontWeight: "500" as const,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  regenerateText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: "500" as const,
  },
});