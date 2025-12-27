import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { ChatSession, ChatMessage, AIMemory } from "@/types";

const SESSIONS_KEY = "@breathhappiness:chat_sessions";
const MEMORY_KEY = "@breathhappiness:ai_memory";

const API_URL = "https://toolkit.rork.com/text/llm/";

export const [ChatProvider, useChat] = createContextHook(() => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsData, memoryData] = await Promise.all([
        AsyncStorage.getItem(SESSIONS_KEY),
        AsyncStorage.getItem(MEMORY_KEY),
      ]);

      if (sessionsData) {
        setSessions(JSON.parse(sessionsData));
      }
      if (memoryData) {
        setMemories(JSON.parse(memoryData));
      }
      console.log("[ChatProvider] Loaded sessions:", sessionsData ? JSON.parse(sessionsData).length : 0);
      console.log("[ChatProvider] Loaded memories:", memoryData ? JSON.parse(memoryData).length : 0);
    } catch (error) {
      console.error("[ChatProvider] Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSessions = useCallback(async (newSessions: ChatSession[]) => {
    try {
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
    } catch (error) {
      console.error("[ChatProvider] Error saving sessions:", error);
    }
  }, []);

  const saveMemories = useCallback(async (newMemories: AIMemory[]) => {
    try {
      await AsyncStorage.setItem(MEMORY_KEY, JSON.stringify(newMemories));
    } catch (error) {
      console.error("[ChatProvider] Error saving memories:", error);
    }
  }, []);

  const createSession = useCallback(async (type: "text" | "voice"): Promise<ChatSession> => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      type,
      title: type === "voice" ? "Voice Chat" : "Text Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    await saveSessions(updatedSessions);
    console.log("[ChatProvider] Created new session:", newSession.id);
    return newSession;
  }, [sessions, saveSessions]);

  const addMessageToSession = useCallback(async (
    sessionId: string,
    message: Omit<ChatMessage, "id" | "timestamp">
  ): Promise<ChatMessage> => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      ...message,
      timestamp: new Date().toISOString(),
    };

    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages: [...session.messages, newMessage],
          updatedAt: new Date().toISOString(),
        };
      }
      return session;
    });

    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
    return newMessage;
  }, [sessions, saveSessions]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, title };
      }
      return session;
    });
    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
  }, [sessions, saveSessions]);

  const updateSessionSummary = useCallback(async (sessionId: string, summary: string) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, summary };
      }
      return session;
    });
    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
  }, [sessions, saveSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
    console.log("[ChatProvider] Deleted session:", sessionId);
  }, [sessions, saveSessions]);

  const extractMemoriesFromSession = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.messages.length < 4) return;

    const conversationText = session.messages
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are analyzing a conversation to extract key memories about the user. 
Extract 1-3 important facts about the user that would be helpful to remember in future conversations.
Focus on: preferences, emotional patterns, goals, concerns, or meaningful insights.

Respond ONLY with a JSON array of objects with "content" and "category" fields.
Categories: "preference", "emotion", "goal", "insight", "concern"

Example response:
[{"content": "User enjoys morning walks for mental clarity", "category": "preference"}, {"content": "User is working on managing work stress", "category": "goal"}]

If nothing significant to remember, respond with: []`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Extract memories from this conversation:\n\n${conversationText}` },
          ],
        }),
      });

      if (!response.ok) return;

      const data = await response.json();
      const completion = data.completion?.trim();
      
      try {
        const extracted = JSON.parse(completion);
        if (Array.isArray(extracted) && extracted.length > 0) {
          const newMemories: AIMemory[] = extracted.map((item: any) => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            content: item.content,
            category: item.category || "insight",
            createdAt: new Date().toISOString(),
            source: session.type === "text" ? "chat" : "voice" as const,
          }));

          const existingContents = new Set(memories.map(m => m.content.toLowerCase()));
          const uniqueNewMemories = newMemories.filter(
            m => !existingContents.has(m.content.toLowerCase())
          );

          if (uniqueNewMemories.length > 0) {
            const updatedMemories = [...uniqueNewMemories, ...memories].slice(0, 50);
            setMemories(updatedMemories);
            await saveMemories(updatedMemories);
            console.log("[ChatProvider] Extracted memories:", uniqueNewMemories.length);
          }
        }
      } catch {
        console.log("[ChatProvider] Could not parse memory extraction response");
      }
    } catch (error) {
      console.error("[ChatProvider] Error extracting memories:", error);
    }
  }, [sessions, memories, saveMemories]);

  const generateSessionTitle = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.messages.length < 2) return;

    const firstMessages = session.messages.slice(0, 4)
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Generate a very short title (3-5 words) for this conversation. Just the title, no quotes or punctuation." },
            { role: "user", content: firstMessages },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const title = data.completion?.trim().slice(0, 40) || session.title;
        await updateSessionTitle(sessionId, title);
      }
    } catch (error) {
      console.error("[ChatProvider] Error generating title:", error);
    }
  }, [sessions, updateSessionTitle]);

  const addMemory = useCallback(async (memory: Omit<AIMemory, "id" | "createdAt">) => {
    const newMemory: AIMemory = {
      id: Date.now().toString(),
      ...memory,
      createdAt: new Date().toISOString(),
    };
    const updatedMemories = [newMemory, ...memories].slice(0, 50);
    setMemories(updatedMemories);
    await saveMemories(updatedMemories);
  }, [memories, saveMemories]);

  const deleteMemory = useCallback(async (memoryId: string) => {
    const updatedMemories = memories.filter(m => m.id !== memoryId);
    setMemories(updatedMemories);
    await saveMemories(updatedMemories);
  }, [memories, saveMemories]);

  const clearAllMemories = useCallback(async () => {
    setMemories([]);
    await saveMemories([]);
  }, [saveMemories]);

  const getMemoryContext = useCallback(() => {
    if (memories.length === 0) return "";
    
    const memoryText = memories
      .slice(0, 15)
      .map(m => `- ${m.content}`)
      .join("\n");
    
    return `\n\nThings I remember about you:\n${memoryText}`;
  }, [memories]);

  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === currentSessionId) || null;
  }, [sessions, currentSessionId]);

  const recentSessions = useMemo(() => {
    return sessions.slice(0, 20);
  }, [sessions]);

  const voiceSessions = useMemo(() => {
    return sessions.filter(s => s.type === "voice");
  }, [sessions]);

  const textSessions = useMemo(() => {
    return sessions.filter(s => s.type === "text");
  }, [sessions]);

  return useMemo(() => ({
    sessions,
    memories,
    currentSession,
    currentSessionId,
    recentSessions,
    voiceSessions,
    textSessions,
    isLoading,
    setCurrentSessionId,
    createSession,
    addMessageToSession,
    updateSessionTitle,
    updateSessionSummary,
    deleteSession,
    extractMemoriesFromSession,
    generateSessionTitle,
    addMemory,
    deleteMemory,
    clearAllMemories,
    getMemoryContext,
  }), [
    sessions,
    memories,
    currentSession,
    currentSessionId,
    recentSessions,
    voiceSessions,
    textSessions,
    isLoading,
    createSession,
    addMessageToSession,
    updateSessionTitle,
    updateSessionSummary,
    deleteSession,
    extractMemoriesFromSession,
    generateSessionTitle,
    addMemory,
    deleteMemory,
    clearAllMemories,
    getMemoryContext,
  ]);
});
