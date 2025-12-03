import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { User, PrivacyMode } from "@/types";

const USER_KEY = "@calmreflect:user";
const ONBOARDING_KEY = "@calmreflect:onboarding";
const PRIVACY_MODE_KEY = "@calmreflect:privacy_mode";

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUserState] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(false);
  const [privacyMode, setPrivacyModeState] = useState<PrivacyMode>("server");
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [userData, onboardingData, privacyData] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(PRIVACY_MODE_KEY),
      ]);

      if (userData) {
        setUserState(JSON.parse(userData));
      }
      if (onboardingData === "true") {
        setHasCompletedOnboardingState(true);
      }
      if (privacyData) {
        setPrivacyModeState(privacyData as PrivacyMode);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUserState(userData);
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const setHasCompletedOnboarding = async (completed: boolean) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, completed.toString());
      setHasCompletedOnboardingState(completed);
    } catch (error) {
      console.error("Error saving onboarding state:", error);
    }
  };

  const setPrivacyMode = async (mode: PrivacyMode) => {
    try {
      await AsyncStorage.setItem(PRIVACY_MODE_KEY, mode);
      setPrivacyModeState(mode);
    } catch (error) {
      console.error("Error saving privacy mode:", error);
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        USER_KEY,
        ONBOARDING_KEY,
        PRIVACY_MODE_KEY,
        "@calmreflect:journal_entries",
        "@calmreflect:checkins",
      ]);
      setUserState(null);
      setHasCompletedOnboardingState(false);
      setPrivacyModeState("server");
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  return {
    user,
    setUser,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
    privacyMode,
    setPrivacyMode,
    clearAllData,
    isLoading,
  };
});