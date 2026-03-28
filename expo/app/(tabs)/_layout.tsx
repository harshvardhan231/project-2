import { Tabs } from "expo-router";
import { Home, MessageSquare, User } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            tint="light"
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Reflect",
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare 
              size={focused ? 26 : 24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "You",
          tabBarIcon: ({ color, focused }) => (
            <User 
              size={focused ? 26 : 24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    height: Platform.OS === "ios" ? 88 : 70,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
    marginTop: 2,
  },
});