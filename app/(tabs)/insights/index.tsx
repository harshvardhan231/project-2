import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Keyboard,
  Animated,
  Easing,
} from "react-native";
import { Send, Bot, User, Sparkles, TrendingUp, Calendar, BookOpen, Leaf, Mic, MicOff, Phone, PhoneOff, WifiOff, RefreshCw } from "lucide-react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import NetInfo from "@react-native-community/netinfo";
import { colors } from "@/constants/colors";
import { useJournal } from "@/providers/JournalProvider";
import { useUser } from "@/providers/UserProvider";
import { generatePersonalizedInsight, AIChatMessage } from "@/utils/ai";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import { router } from "expo-router";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  showJournalButton?: boolean;
  suggestions?: string[];
  isError?: boolean;
}

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { height: screenHeight } = Dimensions.get("window");
const AI_TIMEOUT = 8000;

export default function InsightsScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isCallMode, setIsCallMode] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { entries, checkins } = useJournal();
  const { privacyMode, user } = useUser();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const breathingAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    if (isCallMode) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathingAnim, {
            toValue: 1.2,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breathingAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      breathingAnim.setValue(1);
    }
  }, [isCallMode, breathingAnim]);

  useEffect(() => {
    checkNetworkStatus();
    
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `Hi${user?.name ? ` ${user.name}` : ""}! I&apos;m your AI friend here to listen and chat. I&apos;m here to support you, not diagnose or give medical advice. How are you feeling today?`,
      timestamp: new Date().toISOString(),
      suggestions: [
        "I'm feeling anxious about work",
        "I had a great day today",
        "I'm struggling with sleep",
        "Tell me about my mood patterns"
      ],
    };
    setMessages([welcomeMessage]);
    messagesRef.current = [welcomeMessage];
    
    setupAudio();
    
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
      if (Platform.OS === "web") {
        speechSynthesis.cancel();
      } else {
        Speech.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Run once on mount

  const checkNetworkStatus = async () => {
    try {
      const state = await NetInfo.fetch();
      setIsOffline(!state.isConnected);
    } catch {
      setIsOffline(false);
    }
  };

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error("Failed to setup audio:", error);
    }
  };

  const sendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading) return;

    if (isOffline) {
      Alert.alert(
        "You're offline",
        "AI chat requires an internet connection. You can still log your mood or write in your journal.",
        [
          { text: "Open Journal", onPress: () => router.push("/(tabs)/journal/new" as any) },
          { text: "OK", style: "cancel" }
        ]
      );
      return;
    }

    if (privacyMode === "client") {
      Alert.alert(
        "Privacy Mode Active",
        "AI features are disabled in client-only mode. Would you like to journal about it instead?",
        [
          { text: "Open Journal", onPress: () => router.push("/(tabs)/journal/new" as any) },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => {
      const updated = [...prev, userMessage];
      messagesRef.current = updated;
      return updated;
    });
    setInputText("");
    setIsLoading(true);

    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        handleAITimeout(textToSend);
      }
    }, AI_TIMEOUT);

    try {
      const historyForAI: AIChatMessage[] = messagesRef.current
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      const response = await generatePersonalizedInsight(
        entries,
        checkins,
        textToSend,
        historyForAI
      );
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const isReflective = detectReflectiveContent(textToSend);
      const sentiment = analyzeSentiment(textToSend);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
        showJournalButton: isReflective,
        suggestions: generateProactiveSuggestions(sentiment),
      };

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        messagesRef.current = updated;
        return updated;
      });
      
      if (isCallMode) {
        setTimeout(() => {
          speakText(response);
        }, 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble responding right now. Would you like to journal about it instead?",
        timestamp: new Date().toISOString(),
        isError: true,
        suggestions: ["Open Journal", "Try Again"],
      };
      setMessages(prev => {
        const updated = [...prev, errorMessage];
        messagesRef.current = updated;
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, isOffline, privacyMode, entries, checkins, isCallMode]);

  const handleAITimeout = (originalMessage: string) => {
    setIsLoading(false);
    
    const timeoutMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "I'm taking longer than expected to respond. Would you like to try again or journal about it instead?",
      timestamp: new Date().toISOString(),
      isError: true,
      suggestions: ["Try Again", "Open Journal"],
    };
    
    setMessages(prev => [...prev, timeoutMessage]);
  };

  const detectReflectiveContent = (text: string): boolean => {
    const reflectiveKeywords = [
      "feel", "feeling", "felt", "emotion", "mood", "today", "yesterday",
      "experience", "think", "thought", "realize", "learned", "grateful",
      "anxious", "happy", "sad", "angry", "excited", "worried", "stressed"
    ];
    return reflectiveKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  };

  const analyzeSentiment = (text: string): "positive" | "negative" | "neutral" => {
    const positiveWords = ["happy", "great", "good", "amazing", "wonderful", "excited", "grateful", "love"];
    const negativeWords = ["sad", "angry", "stressed", "anxious", "worried", "tired", "frustrated", "upset"];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  };

  const generateProactiveSuggestions = (sentiment: "positive" | "negative" | "neutral"): string[] => {
    switch (sentiment) {
      case "negative":
        return [
          "Try a breathing exercise",
          "Visit the Calm Garden",
          "Write about this feeling"
        ];
      case "positive":
        return [
          "Capture this in your journal",
          "What made today special?",
          "Share your gratitude"
        ];
      default:
        return [
          "How was your day?",
          "What's on your mind?",
          "Tell me more"
        ];
    }
  };

  const handleSaveToJournal = (userMessage: string) => {
    router.push({
      pathname: "/(tabs)/journal/new",
      params: { prefilledText: userMessage }
    } as any);
  };

  const handleSuggestionPress = (suggestion: string) => {
    if (suggestion === "Try Again") {
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content);
      }
    } else if (suggestion === "Open Journal" || suggestion.includes("Calm Garden")) {
      if (suggestion.includes("Calm Garden")) {
        router.push("/garden" as any);
      } else {
        router.push("/(tabs)/journal/new" as any);
      }
    } else if (suggestion.includes("journal") || suggestion.includes("Write")) {
      router.push("/(tabs)/journal/new" as any);
    } else if (suggestion.includes("breathing")) {
      router.push("/garden" as any);
    } else {
      setInputText(suggestion);
    }
  };

  const startCall = () => {
    setIsCallMode(true);
    const callWelcome: ChatMessage = {
      id: `call-welcome-${Date.now()}`,
      role: "assistant",
      content: "Hi! I'm here to listen. Feel free to share what's on your mind, and I'll respond with voice. Tap the microphone to start talking.",
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, callWelcome]);
    
    setTimeout(() => {
      speakText("Hi! I'm here to listen. Feel free to share what's on your mind. Tap the microphone to start talking.");
    }, 500);
  };

  const endCall = () => {
    setIsCallMode(false);
    setIsRecording(false);
    setIsAISpeaking(false);
    
    if (Platform.OS === "web") {
      speechSynthesis.cancel();
    } else {
      Speech.stop();
    }
    
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
      recordingRef.current = null;
    }
  };

  const speakText = async (text: string) => {
    if (Platform.OS === "web") {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsAISpeaking(true);
      utterance.onend = () => setIsAISpeaking(false);
      
      speechSynthesis.speak(utterance);
    } else {
      setIsAISpeaking(true);
      try {
        await Speech.speak(text, {
          language: "en-US",
          pitch: 1.0,
          rate: 0.9,
          onDone: () => setIsAISpeaking(false),
          onStopped: () => setIsAISpeaking(false),
          onError: () => setIsAISpeaking(false),
        });
      } catch (error) {
        console.error("Speech error:", error);
        setIsAISpeaking(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === "web") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: "audio/wav" });
          await transcribeAudio(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        
        (window as any).currentRecorder = mediaRecorder;
        (window as any).currentStream = stream;
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        recordingRef.current = newRecording;
        setIsRecording(true);
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = async () => {
    try {
      if (Platform.OS === "web") {
        const recorder = (window as any).currentRecorder;
        const stream = (window as any).currentStream;
        if (recorder && recorder.state === "recording") {
          recorder.stop();
        }
        if (stream) {
          stream.getTracks().forEach((track: any) => track.stop());
        }
      } else {
        const currentRecording = recording || recordingRef.current;
        if (currentRecording) {
          await currentRecording.stopAndUnloadAsync();
          const uri = currentRecording.getURI();
          if (uri) {
            await transcribeAudioFromUri(uri);
          }
          setRecording(null);
          recordingRef.current = null;
          
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
          });
        }
      }
      setIsRecording(false);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      
      const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (isCallMode) {
          const transcribedText = data.text;
          if (transcribedText.trim()) {
            setTimeout(() => {
              sendMessage(transcribedText);
            }, 100);
          }
        } else {
          setInputText(data.text);
        }
      } else {
        throw new Error("Transcription failed");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      Alert.alert("Error", "Failed to transcribe audio. Please try again.");
    }
  };

  const transcribeAudioFromUri = async (uri: string) => {
    try {
      const uriParts = uri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      
      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      };
      
      const formData = new FormData();
      formData.append("audio", audioFile as any);
      
      const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (isCallMode) {
          const transcribedText = data.text;
          if (transcribedText.trim()) {
            setTimeout(() => {
              sendMessage(transcribedText);
            }, 100);
          }
        } else {
          setInputText(data.text);
        }
      } else {
        throw new Error("Transcription failed");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      Alert.alert("Error", "Failed to transcribe audio. Please try again.");
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === "user";
    const userMessageForJournal = messages.find(m => m.role === "user" && messages.indexOf(m) === messages.indexOf(message) - 1);
    
    return (
      <View key={message.id} style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        <View style={[styles.messageIcon, isUser && styles.userMessageIcon]}>
          {isUser ? (
            <User size={16} color={colors.white} />
          ) : (
            <Bot size={16} color={colors.white} />
          )}
        </View>
        <GlassCard style={[
          styles.messageBubble, 
          isUser && styles.userMessageBubble,
          message.isError && styles.errorMessageBubble
        ]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content.replace(/&apos;/g, "'")}
          </Text>
          
          {message.showJournalButton && userMessageForJournal && (
            <TouchableOpacity 
              style={styles.journalButton}
              onPress={() => handleSaveToJournal(userMessageForJournal.content)}
            >
              <BookOpen size={16} color="#6366F1" />
              <Text style={styles.journalButtonText}>Save to Journal</Text>
            </TouchableOpacity>
          )}
          
          {message.suggestions && message.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {message.suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionChip,
                    message.isError && suggestion === "Try Again" && styles.retryChip
                  ]}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  {message.isError && suggestion === "Try Again" && (
                    <RefreshCw size={12} color="#6366F1" style={{ marginRight: 4 }} />
                  )}
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </Text>
        </GlassCard>
      </View>
    );
  };

  const renderOfflineBanner = () => {
    if (!isOffline) return null;
    
    return (
      <View style={styles.offlineBanner}>
        <WifiOff size={16} color="#fff" />
        <Text style={styles.offlineBannerText}>You&apos;re offline. You can still journal or log your mood.</Text>
      </View>
    );
  };

  const renderQuickInsights = () => {
    return (
      <GlassCard style={styles.quickInsights}>
        <Text style={styles.quickInsightsTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insightCards}>
          <TouchableOpacity 
            style={styles.insightCard}
            onPress={() => setInputText("What patterns do you see in my mood over the past week?")}
          >
            <TrendingUp size={20} color="#6366F1" />
            <Text style={styles.insightCardText}>Mood Patterns</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.insightCard}
            onPress={() => setInputText("What themes appear most in my recent journal entries?")}
          >
            <Sparkles size={20} color="#6366F1" />
            <Text style={styles.insightCardText}>Common Themes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.insightCard}
            onPress={() => router.push("/garden" as any)}
          >
            <Leaf size={20} color="#10B981" />
            <Text style={styles.insightCardText}>Calm Garden</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.insightCard}
            onPress={() => setInputText("How has my emotional wellbeing changed recently?")}
          >
            <Calendar size={20} color="#6366F1" />
            <Text style={styles.insightCardText}>Progress Review</Text>
          </TouchableOpacity>
        </ScrollView>
      </GlassCard>
    );
  };

  if (isCallMode) {
    return (
      <AuroraBackground>
        <SafeAreaView style={styles.callContainer}>
          <GlassCard style={styles.callHeader}>
            <View style={styles.callInfo}>
              <Animated.View style={[
                styles.aiAvatar, 
                { transform: [{ scale: isAISpeaking ? breathingAnim : 1 }] }
              ]}>
                <Bot size={32} color={colors.white} />
              </Animated.View>
              <View style={styles.callDetails}>
                <Text style={styles.callTitle}>AI Friend</Text>
                <Text style={styles.callStatus}>
                  {isAISpeaking ? "Speaking..." : isRecording ? "Listening..." : "Ready to chat"}
                </Text>
              </View>
            </View>
          </GlassCard>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.callMessagesContainer}
            contentContainerStyle={styles.callMessagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {messages.slice(-10).map(renderMessage)}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#6366F1" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          <GlassCard style={styles.callControls}>
            <TouchableOpacity
              style={[styles.callButton, styles.endCallButton]}
              onPress={endCall}
              testID="end-call-button"
            >
              <PhoneOff size={24} color={colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.callButton, styles.micButton, isRecording && styles.micButtonActive]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isAISpeaking}
              testID="call-mic-button"
            >
              {isRecording ? (
                <MicOff size={32} color={colors.white} />
              ) : (
                <Mic size={32} color={colors.white} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.callButton, styles.speakerButton]}
              onPress={() => console.log("Speaker toggle")}
              testID="speaker-button"
            >
              <Sparkles size={24} color={colors.white} />
            </TouchableOpacity>
          </GlassCard>
        </SafeAreaView>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.container}>
        {renderOfflineBanner()}
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {renderQuickInsights()}
          
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#6366F1" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          <View style={[
            styles.inputContainer,
            keyboardVisible && styles.inputContainerKeyboardOpen
          ]}>
            <View style={styles.inputActionsRow}>
              <TouchableOpacity
                style={styles.callModeButton}
                onPress={startCall}
                activeOpacity={0.7}
                testID="call-button"
              >
                <Phone size={18} color="#6366F1" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.7}
                testID="voice-button"
              >
                {isRecording ? (
                  <MicOff size={18} color="#EF4444" />
                ) : (
                  <Mic size={18} color="#10B981" />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={isRecording ? "Recording..." : "Type a message..."}
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                testID="insights-input"
                editable={!isRecording}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={() => sendMessage()}
                disabled={!inputText.trim() || isLoading}
                activeOpacity={0.7}
                testID="send-button"
              >
                <Send size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineBannerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500" as const,
  },
  quickInsights: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
  },
  quickInsightsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 12,
  },
  insightCards: {
    flexDirection: "row",
  },
  insightCard: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
    minWidth: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  insightCardText: {
    fontSize: 12,
    color: "#1A1A1A",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  userMessageContainer: {
    flexDirection: "row-reverse",
  },
  messageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  userMessageIcon: {
    backgroundColor: "#10B981",
    marginRight: 0,
    marginLeft: 8,
  },
  messageBubble: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: "80%",
    marginBottom: 8,
  },
  userMessageBubble: {
    backgroundColor: "#10B981",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  errorMessageBubble: {
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.5)",
  },
  messageText: {
    fontSize: 16,
    color: "#1A1A1A",
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
  },
  userMessageTime: {
    color: colors.white,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === "ios" ? 100 : 80, // Default for tab bar
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  inputContainerKeyboardOpen: {
    marginBottom: 10, // When keyboard is open
  },
  inputActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 44,
    maxHeight: 100,
    color: "#1A1A1A",
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.4,
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
  },
  journalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  journalButtonText: {
    fontSize: 14,
    color: "#6366F1",
    marginLeft: 6,
    fontWeight: "500" as const,
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  retryChip: {
    borderColor: "#6366F1",
  },
  suggestionText: {
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "500" as const,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  voiceButtonActive: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  callModeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 0.12)",
  },
  callContainer: {
    flex: 1,
    padding: 16,
  },
  callHeader: {
    padding: 20,
    marginBottom: 16,
  },
  callInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  callDetails: {
    flex: 1,
  },
  callTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  callStatus: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  callMessagesContainer: {
    flex: 1,
  },
  callMessagesContent: {
    padding: 8,
    paddingBottom: 20,
    minHeight: screenHeight * 0.4,
  },
  callControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 20,
    marginTop: 16,
  },
  callButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  endCallButton: {
    backgroundColor: "#EF4444",
  },
  micButton: {
    backgroundColor: "#6366F1",
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  micButtonActive: {
    backgroundColor: "#EF4444",
  },
  speakerButton: {
    backgroundColor: "#10B981",
  },
});