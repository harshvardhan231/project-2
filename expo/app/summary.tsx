import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar, Heart } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useJournal } from "@/providers/JournalProvider";
import { MoodEmoji } from "@/components/MoodEmoji";

export default function SummaryScreen() {
  const { todayCheckin, moodTrend, streakCount, recentEntries, checkins } = useJournal();

  const getWeeklyMoodData = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toDateString();
      
      const checkin = checkins.find(c => 
        new Date(c.timestamp).toDateString() === dateString
      );
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        mood: checkin?.mood || null,
        score: checkin?.mood_score || 0,
      });
    }
    
    return last7Days;
  };

  const weeklyData = getWeeklyMoodData();
  const avgMoodScore = weeklyData.reduce((sum, day) => sum + day.score, 0) / 7;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primaryLight, colors.white]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Summary</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Today's Check-in */}
          {todayCheckin && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's Check-in</Text>
              <View style={styles.todayCheckin}>
                <MoodEmoji mood={todayCheckin.mood} size={48} />
                <View style={styles.todayDetails}>
                  <Text style={styles.todayMood}>{todayCheckin.mood}</Text>
                  <Text style={styles.todayThought}>{todayCheckin.thought}</Text>
                  {todayCheckin.action && (
                    <Text style={styles.todayAction}>Action: {todayCheckin.action}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Weekly Mood Trend */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Mood Trend</Text>
            <View style={styles.trendContainer}>
              <View style={styles.trendHeader}>
                {moodTrend && (
                  <>
                    {moodTrend.direction === 'improving' ? (
                      <TrendingUp size={24} color={colors.green} />
                    ) : moodTrend.direction === 'declining' ? (
                      <TrendingDown size={24} color={colors.error} />
                    ) : (
                      <Minus size={24} color={colors.gray} />
                    )}
                    <Text style={[
                      styles.trendText,
                      { color: moodTrend.direction === 'improving' ? colors.green : 
                               moodTrend.direction === 'declining' ? colors.error : colors.gray }
                    ]}>
                      {moodTrend.direction === 'improving' ? 'Improving' : 
                       moodTrend.direction === 'declining' ? 'Needs attention' : 'Stable'}
                    </Text>
                  </>
                )}
              </View>
              
              <View style={styles.weeklyChart}>
                {weeklyData.map((day, index) => (
                  <View key={index} style={styles.dayColumn}>
                    <View style={styles.moodIndicator}>
                      {day.mood ? (
                        <MoodEmoji mood={day.mood} size={20} />
                      ) : (
                        <View style={styles.noMoodIndicator} />
                      )}
                    </View>
                    <Text style={styles.dayLabel}>{day.date}</Text>
                  </View>
                ))}
              </View>
              
              <Text style={styles.avgScore}>
                Average mood score: {avgMoodScore.toFixed(1)}/5
              </Text>
            </View>
          </View>

          {/* Streak & Stats */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Calendar size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{streakCount}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              
              <View style={styles.statItem}>
                <Heart size={24} color={colors.error} />
                <Text style={styles.statNumber}>{checkins.length}</Text>
                <Text style={styles.statLabel}>Total Check-ins</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>📝</Text>
                <Text style={styles.statNumber}>{recentEntries.length}</Text>
                <Text style={styles.statLabel}>Journal Entries</Text>
              </View>
            </View>
          </View>

          {/* Recent Insights */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Patterns</Text>
            <View style={styles.insightsList}>
              {checkins.length >= 3 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightText}>
                    You've been consistent with check-ins this week! 🎉
                  </Text>
                </View>
              )}
              
              {moodTrend?.direction === 'improving' && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightText}>
                    Your mood has been trending upward - keep up the great work! 📈
                  </Text>
                </View>
              )}
              
              {streakCount >= 7 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightText}>
                    Amazing! You've maintained a {streakCount}-day streak. 🔥
                  </Text>
                </View>
              )}
              
              {checkins.length === 0 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightText}>
                    Start your wellness journey with your first check-in today! 🌟
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 16,
  },
  todayCheckin: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  todayDetails: {
    flex: 1,
    marginLeft: 16,
  },
  todayMood: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    textTransform: "capitalize",
    marginBottom: 4,
  },
  todayThought: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  todayAction: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: "italic",
  },
  trendContainer: {
    alignItems: "center",
  },
  trendHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  trendText: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginLeft: 8,
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  dayColumn: {
    alignItems: "center",
    flex: 1,
  },
  moodIndicator: {
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  noMoodIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
  },
  dayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  avgScore: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statEmoji: {
    fontSize: 24,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 12,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});