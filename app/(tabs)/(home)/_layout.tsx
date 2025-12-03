import { Stack } from "expo-router";
import React from "react";
import { colors } from "@/constants/colors";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "600" as const,
        },
      }}
    >
      <Stack.Screen 
        name="home" 
        options={{ 
          title: "CalmReflect",
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="checkin" 
        options={{ 
          title: "Daily Check-in",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="summary" 
        options={{ 
          title: "Your Summary",
        }} 
      />
    </Stack>
  );
}