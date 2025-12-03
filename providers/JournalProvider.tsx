import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { JournalEntry, CheckIn, Mood, LLMSummary } from "@/types";
import { useUser } from "./UserProvider";
import { generateSummary } from "@/utils/ai";

const ENTRIES_KEY = "@calmreflect:journal_entries";
const CHECKINS_KEY = "@calmreflect:checkins";

export const [JournalProvider, useJournal] = createContextHook(() => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyInsight, setWeeklyInsight] = useState<LLMSummary | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const { privacyMode } = useUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, checkinsData] = await Promise.all([
        AsyncStorage.getItem(ENTRIES_KEY),
        AsyncStorage.getItem(CHECKINS_KEY),
      ]);

      if (entriesData) {
        setEntries(JSON.parse(entriesData));
      }
      if (checkinsData) {
        setCheckins(JSON.parse(checkinsData));
      }
    } catch (error) {
      console.error("Error loading journal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntry = useCallback(async (data: {
    mood: Mood;
    text: string;
    tags: string[];
    images?: string[];
  }) => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      user_id: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mode: privacyMode,
      mood: data.mood,
      mood_score: getMoodScore(data.mood),
      tags: data.tags,
      text: data.text,
      images: data.images,
      encrypted: privacyMode === "client",
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(updatedEntries));
    return newEntry;
  }, [entries, privacyMode]);

  const saveCheckin = useCallback(async (data: {
    mood: Mood;
    thought: string;
    action?: string;
  }) => {
    const newCheckin: CheckIn = {
      id: Date.now().toString(),
      user_id: "user-1",
      timestamp: new Date().toISOString(),
      mood: data.mood,
      mood_score: getMoodScore(data.mood),
      thought: data.thought,
      action: data.action,
      duration_seconds: 45,
    };

    const updatedCheckins = [newCheckin, ...checkins];
    setCheckins(updatedCheckins);
    await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(updatedCheckins));
    return newCheckin;
  }, [checkins]);

  const deleteEntry = useCallback(async (id: string) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(updatedEntries));
  }, [entries]);

  const getMoodScore = (mood: Mood): number => {
    const scores: Record<Mood, number> = {
      happy: 5,
      excited: 5,
      calm: 4,
      anxious: 2,
      sad: 2,
      angry: 1,
    };
    return scores[mood];
  };

  const recentEntries = useMemo(() => {
    return entries.slice(0, 10);
  }, [entries]);

  const todayCheckin = useMemo(() => {
    const today = new Date().toDateString();
    return checkins.find(c => 
      new Date(c.timestamp).toDateString() === today
    );
  }, [checkins]);

  const moodTrend = useMemo(() => {
    if (checkins.length < 2) return null;
    
    const recent = checkins.slice(0, 7);
    const avgRecent = recent.reduce((sum, c) => sum + c.mood_score, 0) / recent.length;
    
    const older = checkins.slice(7, 14);
    if (older.length === 0) return null;
    
    const avgOlder = older.reduce((sum, c) => sum + c.mood_score, 0) / older.length;
    const change = avgRecent - avgOlder;
    
    return {
      direction: change > 0.2 ? 'improving' : change < -0.2 ? 'declining' : 'stable',
      change: Math.abs(change),
      current: avgRecent
    };
  }, [checkins]);

  const streakCount = useMemo(() => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const hasCheckin = checkins.some(c => 
        new Date(c.timestamp).toDateString() === dateString
      );
      
      if (hasCheckin) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [checkins]);

  const generateWeeklyInsight = useCallback(async () => {
    if (privacyMode === 'client' || entries.length < 3) return;
    
    setInsightLoading(true);
    try {
      const recentEntries = entries.slice(0, 7);
      const insight = await generateSummary(recentEntries);
      setWeeklyInsight(insight);
      
      // Cache the insight
      await AsyncStorage.setItem('@calmreflect:weekly_insight', JSON.stringify({
        insight,
        generated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error generating weekly insight:', error);
    } finally {
      setInsightLoading(false);
    }
  }, [privacyMode, entries]);

  const loadCachedInsight = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('@calmreflect:weekly_insight');
      if (cached) {
        const { insight, generated } = JSON.parse(cached);
        const generatedDate = new Date(generated);
        const daysSince = (Date.now() - generatedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Use cached insight if less than 3 days old
        if (daysSince < 3) {
          setWeeklyInsight(insight);
        } else {
          generateWeeklyInsight();
        }
      } else if (entries.length >= 3) {
        generateWeeklyInsight();
      }
    } catch (error) {
      console.error('Error loading cached insight:', error);
    }
  }, [entries.length, generateWeeklyInsight]);

  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      loadCachedInsight();
    }
  }, [isLoading, entries.length, privacyMode, loadCachedInsight]);

  return useMemo(() => ({
    entries,
    checkins,
    recentEntries,
    todayCheckin,
    moodTrend,
    streakCount,
    weeklyInsight,
    insightLoading,
    saveEntry,
    saveCheckin,
    deleteEntry,
    generateWeeklyInsight,
    isLoading,
  }), [
    entries,
    checkins,
    recentEntries,
    todayCheckin,
    moodTrend,
    streakCount,
    weeklyInsight,
    insightLoading,
    saveEntry,
    saveCheckin,
    deleteEntry,
    generateWeeklyInsight,
    isLoading,
  ]);
});