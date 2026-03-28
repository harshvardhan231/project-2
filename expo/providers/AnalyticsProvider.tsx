import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import createContextHook from "@nkzw/create-context-hook";
import Constants from "expo-constants";

const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey || process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "";
const POSTHOG_HOST = "https://us.i.posthog.com";

export const [AnalyticsContextProvider, useAnalytics] = createContextHook(() => {
  const posthog = usePostHog();

  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (!posthog) {
      console.log("[Analytics] PostHog not initialized, skipping event:", eventName);
      return;
    }
    
    console.log("[Analytics] Tracking event:", eventName, properties);
    posthog.capture(eventName, {
      ...properties,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }, [posthog]);

  const identifyUser = useCallback((userId: string, properties?: Record<string, string | number | boolean>) => {
    if (!posthog) {
      console.log("[Analytics] PostHog not initialized, skipping identify");
      return;
    }
    
    console.log("[Analytics] Identifying user:", userId);
    posthog.identify(userId, properties);
  }, [posthog]);

  const resetUser = useCallback(() => {
    if (!posthog) return;
    console.log("[Analytics] Resetting user");
    posthog.reset();
  }, [posthog]);

  const trackScreenView = useCallback((screenName: string) => {
    trackEvent("screen_view", { screen_name: screenName });
  }, [trackEvent]);

  const trackOnboardingComplete = useCallback((userName?: string) => {
    trackEvent("onboarding_completed", { has_name: !!userName });
  }, [trackEvent]);

  const trackCheckinCompleted = useCallback((mood: string) => {
    trackEvent("checkin_completed", { mood });
  }, [trackEvent]);

  const trackJournalEntryCreated = useCallback((mood: string, tagsCount: number, hasImages: boolean) => {
    trackEvent("journal_entry_created", { 
      mood, 
      tags_count: tagsCount,
      has_images: hasImages,
    });
  }, [trackEvent]);

  const trackBreathingExerciseStarted = useCallback((duration: number) => {
    trackEvent("breathing_exercise_started", { duration_seconds: duration });
  }, [trackEvent]);

  const trackBreathingExerciseCompleted = useCallback((duration: number) => {
    trackEvent("breathing_exercise_completed", { duration_seconds: duration });
  }, [trackEvent]);

  const trackGardenSessionStarted = useCallback(() => {
    trackEvent("garden_session_started");
  }, [trackEvent]);

  const trackGardenSessionEnded = useCallback((flowersPlanted: number) => {
    trackEvent("garden_session_ended", { flowers_planted: flowersPlanted });
  }, [trackEvent]);

  const trackAIChatStarted = useCallback(() => {
    trackEvent("ai_chat_started");
  }, [trackEvent]);

  const trackAIChatMessageSent = useCallback(() => {
    trackEvent("ai_chat_message_sent");
  }, [trackEvent]);

  const trackCrisisResourcesViewed = useCallback(() => {
    trackEvent("crisis_resources_viewed");
  }, [trackEvent]);

  const trackDataExported = useCallback(() => {
    trackEvent("data_exported");
  }, [trackEvent]);

  const trackSettingsChanged = useCallback((setting: string, value: unknown) => {
    trackEvent("settings_changed", { setting, value: String(value) });
  }, [trackEvent]);

  return useMemo(() => ({
    trackEvent,
    identifyUser,
    resetUser,
    trackScreenView,
    trackOnboardingComplete,
    trackCheckinCompleted,
    trackJournalEntryCreated,
    trackBreathingExerciseStarted,
    trackBreathingExerciseCompleted,
    trackGardenSessionStarted,
    trackGardenSessionEnded,
    trackAIChatStarted,
    trackAIChatMessageSent,
    trackCrisisResourcesViewed,
    trackDataExported,
    trackSettingsChanged,
  }), [
    trackEvent,
    identifyUser,
    resetUser,
    trackScreenView,
    trackOnboardingComplete,
    trackCheckinCompleted,
    trackJournalEntryCreated,
    trackBreathingExerciseStarted,
    trackBreathingExerciseCompleted,
    trackGardenSessionStarted,
    trackGardenSessionEnded,
    trackAIChatStarted,
    trackAIChatMessageSent,
    trackCrisisResourcesViewed,
    trackDataExported,
    trackSettingsChanged,
  ]);
});

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  if (!POSTHOG_API_KEY) {
    console.warn("[Analytics] PostHog API key not configured. Analytics will be disabled.");
    return (
      <AnalyticsContextProvider>
        {children}
      </AnalyticsContextProvider>
    );
  }

  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        enableSessionReplay: false,
      }}
      autocapture={{
        captureTouches: true,
        captureScreens: true,
      }}
    >
      <AnalyticsContextProvider>
        {children}
      </AnalyticsContextProvider>
    </PostHogProvider>
  );
}
