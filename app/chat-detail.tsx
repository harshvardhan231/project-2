import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Mic, MessageCircle } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useChat } from "@/providers/ChatProvider";
import { ChatMessage } from "@/types";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions } = useChat();
  
  const session = sessions.find(s => s.id === id);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === "user";
    const showDate = index === 0 || 
      new Date(item.timestamp).toDateString() !== 
      new Date(session!.messages[index - 1].timestamp).toDateString();

    return (
      <>
        {showDate && (
          <Text style={styles.dateHeader}>{formatDate(item.timestamp)}</Text>
        )}
        <View style={[styles.messageRow, isUser && styles.userRow]}>
          <View style={[styles.messageBubble, isUser && styles.userBubble]}>
            <Text style={[styles.messageText, isUser && styles.userText]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTime, isUser && styles.userTime]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  if (!session) {
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
            <Text style={styles.headerTitle}>Chat Not Found</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>This conversation no longer exists</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              {session.type === "voice" ? (
                <Mic size={16} color="#6366F1" />
              ) : (
                <MessageCircle size={16} color="#10B981" />
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>
                {session.title}
              </Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {session.messages.length} messages
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          data={session.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />
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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#1F2937",
    maxWidth: 200,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dateHeader: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 16,
    fontWeight: "500" as const,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#6366F1",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
  },
  userText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 6,
  },
  userTime: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
});
