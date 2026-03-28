export type Mood = "happy" | "calm" | "anxious" | "sad" | "angry" | "excited";

export type PrivacyMode = "server" | "client";

export interface User {
  name: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  mode: PrivacyMode;
  mood: Mood;
  mood_score: number;
  tags: string[];
  text: string;
  images?: string[];
  llm_summary_id?: string;
  encrypted: boolean;
}

export interface CheckIn {
  id: string;
  user_id: string;
  timestamp: string;
  mood: Mood;
  mood_score: number;
  thought: string;
  action?: string;
  duration_seconds: number;
}

export interface LLMSummary {
  summary: string;
  themes: string[];
  action: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  type: "text" | "voice";
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
}

export interface AIMemory {
  id: string;
  content: string;
  category: "preference" | "emotion" | "goal" | "insight" | "concern";
  createdAt: string;
  source: "chat" | "voice" | "journal";
}