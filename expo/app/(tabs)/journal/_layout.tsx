import { Stack } from "expo-router";
import React from "react";
import { colors } from "@/constants/colors";

export default function JournalLayout() {
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
        name="index" 
        options={{ 
          title: "Journal",
          headerLargeTitle: true,
        }} 
      />
      <Stack.Screen 
        name="new" 
        options={{ 
          title: "New Entry",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: "Entry",
        }} 
      />
    </Stack>
  );
}