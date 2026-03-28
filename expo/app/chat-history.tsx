import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { 
  ChevronLeft, 
  MessageCircle, 
  Mic, 
  Trash2, 
  Brain,
  Clock,
} from "lucide-react-native";
import { router } from "expo-router";
import { useChat } from "@/providers/ChatProvider";
import { ChatSession } from "@/types";

export default function ChatHistoryScreen() {
  const { 
    recentSessions, 
    memories, 
    deleteSession,
    clearAllMemories,
  } = useChat();
  const [activeTab, setActiveTab] = useState<"chats" | "memory">("chats");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDeleteSession = (session: ChatSession) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteSession(session.id),
        },
      ]
    );
  };

  const handleClearMemories = () => {
    Alert.alert(
      "Clear AI Memory",
      "This will remove all stored memories. The AI will no longer remember past insights about you.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: clearAllMemories,
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      preference: "#10B981",
      emotion: "#F59E0B",
      goal: "#6366F1",
      insight: "#8B5CF6",
      concern: "#EF4444",
    };
    return colors[category] || "#6B7280";
  };

  const getCategoryIcon = (category: string) => {
    return category.charAt(0).toUpperCase();
  };

  const renderSessionItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => router.push({ pathname: "/chat-detail", params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={styles.sessionIconContainer}>
        {item.type === "voice" ? (
          <Mic size={20} color="#6366F1" />
        ) : (
          <MessageCircle size={20} color="#10B981" />
        )}
      </View>
      <View style={styles.sessionContent}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.sessionMeta}>
          <Clock size={12} color="#9CA3AF" />
          <Text style={styles.sessionDate}>{formatDate(item.updatedAt)}</Text>
          <Text style={styles.sessionMessages}>
            {item.messages.length} messages
          </Text>
        </View>
        {item.summary && (
          <Text style={styles.sessionSummary} numberOfLines={2}>
            {item.summary}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteSession(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={18} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMemoryItem = ({ item }: { item: typeof memories[0] }) => (
    <View style={styles.memoryCard}>
      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
        <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
          {getCategoryIcon(item.category)}
        </Text>
      </View>
      <View style={styles.memoryContent}>
        <Text style={styles.memoryText}>{item.content}</Text>
        <View style={styles.memoryMeta}>
          <Text style={styles.memoryCategory}>{item.category}</Text>
          <Text style={styles.memorySource}>from {item.source}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#F8FAFC", "#EEF2FF", "#F8FAFC"]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat History</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "chats" && styles.activeTab]}
            onPress={() => setActiveTab("chats")}
          >
            <MessageCircle 
              size={18} 
              color={activeTab === "chats" ? "#6366F1" : "#9CA3AF"} 
            />
            <Text style={[styles.tabText, activeTab === "chats" && styles.activeTabText]}>
              Conversations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "memory" && styles.activeTab]}
            onPress={() => setActiveTab("memory")}
          >
            <Brain 
              size={18} 
              color={activeTab === "memory" ? "#6366F1" : "#9CA3AF"} 
            />
            <Text style={[styles.tabText, activeTab === "memory" && styles.activeTabText]}>
              AI Memory ({memories.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "chats" ? (
          <FlatList
            data={recentSessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MessageCircle size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptyText}>
                  Start a chat or voice session to see your history here
                </Text>
              </View>
            }
          />
        ) : (
          <>
            {memories.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearMemories}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.clearButtonText}>Clear All Memories</Text>
              </TouchableOpacity>
            )}
            <FlatList
              data={memories}
              renderItem={renderMemoryItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Brain size={48} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No memories yet</Text>
                  <Text style={styles.emptyText}>
                    After meaningful conversations, the AI will remember important things about you
                  </Text>
                </View>
              }
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1F2937",
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#9CA3AF",
  },
  activeTabText: {
    color: "#6366F1",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1F2937",
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sessionMessages: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  sessionSummary: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    lineHeight: 18,
  },
  deleteButton: {
    padding: 8,
  },
  memoryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  memoryContent: {
    flex: 1,
  },
  memoryText: {
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
    marginBottom: 6,
  },
  memoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memoryCategory: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  memorySource: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500" as const,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
