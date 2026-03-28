import { Stack } from "expo-router";
import React from "react";
import { colors } from "@/constants/colors";

export default function GardenLayout() {
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
          title: "Calm Garden",
          headerShown: false,
        }} 
      />
    </Stack>
  );
}