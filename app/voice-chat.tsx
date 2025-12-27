import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
} from "lucide-react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useJournal } from "@/providers/JournalProvider";
import { useUser } from "@/providers/UserProvider";
import { generatePersonalizedInsight, AIChatMessage } from "@/utils/ai";



interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function VoiceChatScreen() {
  const { entries, checkins } = useJournal();
  const { user, privacyMode } = useUser();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [statusText, setStatusText] = useState("Tap to speak");
  
  const recording = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const messagesRef = useRef<VoiceMessage[]>([]);

  useEffect(() => {
    setupAudio();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    const userName = user?.name;
    const welcomeTimeout = setTimeout(() => {
      const greeting = `Hi${userName ? ` ${userName}` : ""}! I'm here to listen. Just tap the microphone and start talking.`;
      speakTextInitial(greeting);
      
      const welcomeMessage: VoiceMessage = {
        id: "welcome",
        role: "assistant",
        content: greeting,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      messagesRef.current = [welcomeMessage];
    }, 800);
    
    return () => {
      clearTimeout(welcomeTimeout);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      pulseAnim.setValue(1);
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
      waveAnim3.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  useEffect(() => {
    if (isSpeaking) {
      startWaveAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    const createWave = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createWave(waveAnim1, 0),
      createWave(waveAnim2, 200),
      createWave(waveAnim3, 400),
    ]).start();
  };

  const setupAudio = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Microphone access is needed for voice chat.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("[VoiceChat] Audio setup complete");
    } catch (error) {
      console.error("[VoiceChat] Audio setup error:", error);
    }
  };

  const cleanup = async () => {
    try {
      if (recording.current) {
        await recording.current.stopAndUnloadAsync();
        recording.current = null;
      }
      if (Platform.OS === "web") {
        speechSynthesis.cancel();
      } else {
        Speech.stop();
      }
    } catch (error) {
      console.error("[VoiceChat] Cleanup error:", error);
    }
  };

  const speakTextInitial = (text: string) => {
    setIsSpeaking(true);
    setStatusText("Speaking...");
    
    if (Platform.OS === "web") {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setStatusText("Tap to speak");
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setStatusText("Tap to speak");
      };
      
      speechSynthesis.speak(utterance);
    } else {
      Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.95,
        onDone: () => {
          setIsSpeaking(false);
          setStatusText("Tap to speak");
        },
        onStopped: () => {
          setIsSpeaking(false);
          setStatusText("Tap to speak");
        },
        onError: () => {
          setIsSpeaking(false);
          setStatusText("Tap to speak");
        },
      });
    }
  };

  const speakText = useCallback(async (text: string) => {
    if (isMuted) return;
    
    setIsSpeaking(true);
    setStatusText("Speaking...");
    
    try {
      if (Platform.OS === "web") {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setStatusText("Tap to speak");
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          setStatusText("Tap to speak");
        };
        
        speechSynthesis.speak(utterance);
      } else {
        await Speech.speak(text, {
          language: "en-US",
          pitch: 1.0,
          rate: 0.95,
          onDone: () => {
            setIsSpeaking(false);
            setStatusText("Tap to speak");
          },
          onStopped: () => {
            setIsSpeaking(false);
            setStatusText("Tap to speak");
          },
          onError: () => {
            setIsSpeaking(false);
            setStatusText("Tap to speak");
          },
        });
      }
    } catch (error) {
      console.error("[VoiceChat] Speech error:", error);
      setIsSpeaking(false);
      setStatusText("Tap to speak");
    }
  }, [isMuted]);

  const startListening = async () => {
    if (isSpeaking) {
      if (Platform.OS === "web") {
        speechSynthesis.cancel();
      } else {
        Speech.stop();
      }
      setIsSpeaking(false);
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsListening(true);
    setStatusText("Listening...");
    setCurrentTranscript("");

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
          stream.getTracks().forEach(track => track.stop());
          await processAudio(audioBlob);
        };
        
        mediaRecorder.start();
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
        
        recording.current = newRecording;
        console.log("[VoiceChat] Recording started");
      }
    } catch (error) {
      console.error("[VoiceChat] Start recording error:", error);
      setIsListening(false);
      setStatusText("Tap to speak");
      Alert.alert("Error", "Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    setStatusText("Processing...");
    setIsProcessing(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    try {
      if (Platform.OS === "web") {
        const recorder = (window as any).currentRecorder;
        const stream = (window as any).currentStream;
        if (recorder && recorder.state === "recording") {
          recorder.stop();
        }
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
      } else {
        if (recording.current) {
          await recording.current.stopAndUnloadAsync();
          const uri = recording.current.getURI();
          recording.current = null;
          
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
          });
          
          if (uri) {
            await processAudioFromUri(uri);
          }
        }
      }
    } catch (error) {
      console.error("[VoiceChat] Stop recording error:", error);
      setIsProcessing(false);
      setStatusText("Tap to speak");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      
      console.log("[VoiceChat] Transcribing audio...");
      const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        const transcribedText = data.text?.trim();
        console.log("[VoiceChat] Transcribed:", transcribedText);
        
        if (transcribedText) {
          setCurrentTranscript(transcribedText);
          await sendToAI(transcribedText);
        } else {
          setStatusText("Didn't catch that. Try again.");
          setTimeout(() => setStatusText("Tap to speak"), 2000);
        }
      } else {
        throw new Error("Transcription failed");
      }
    } catch (error) {
      console.error("[VoiceChat] Transcription error:", error);
      setStatusText("Couldn't process audio");
      setTimeout(() => setStatusText("Tap to speak"), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudioFromUri = async (uri: string) => {
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
      
      console.log("[VoiceChat] Transcribing audio from URI...");
      const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        const transcribedText = data.text?.trim();
        console.log("[VoiceChat] Transcribed:", transcribedText);
        
        if (transcribedText) {
          setCurrentTranscript(transcribedText);
          await sendToAI(transcribedText);
        } else {
          setStatusText("Didn't catch that. Try again.");
          setTimeout(() => setStatusText("Tap to speak"), 2000);
        }
      } else {
        throw new Error("Transcription failed");
      }
    } catch (error) {
      console.error("[VoiceChat] Transcription error:", error);
      setStatusText("Couldn't process audio");
      setTimeout(() => setStatusText("Tap to speak"), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendToAI = async (text: string) => {
    if (privacyMode === "client") {
      speakText("AI features are disabled in privacy mode.");
      return;
    }

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => {
      const updated = [...prev, userMessage];
      messagesRef.current = updated;
      return updated;
    });

    setStatusText("Thinking...");

    try {
      const historyForAI: AIChatMessage[] = messagesRef.current
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await generatePersonalizedInsight(
        entries,
        checkins,
        text,
        historyForAI
      );

      console.log("[VoiceChat] AI response received");

      const assistantMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        messagesRef.current = updated;
        return updated;
      });

      speakText(response);
    } catch (error) {
      console.error("[VoiceChat] AI error:", error);
      const errorResponse = "I'm having trouble responding right now. Please try again.";
      speakText(errorResponse);
    }
  };

  const handleMicPress = () => {
    if (isProcessing) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleEndCall = () => {
    cleanup();
    router.back();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && isSpeaking) {
      if (Platform.OS === "web") {
        speechSynthesis.cancel();
      } else {
        Speech.stop();
      }
      setIsSpeaking(false);
    }
  };

  const getStatusColor = () => {
    if (isListening) return "#10B981";
    if (isSpeaking) return "#6366F1";
    if (isProcessing) return "#F59E0B";
    return "#6B7280";
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleEndCall}
            >
              <ChevronDown size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Voice Chat</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={styles.statusBadgeText}>{statusText}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.muteButton}
              onPress={toggleMute}
            >
              {isMuted ? (
                <VolumeX size={24} color="#EF4444" />
              ) : (
                <Volume2 size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.visualizerContainer}>
            {(isListening || isSpeaking) && (
              <View style={styles.waveContainer}>
                <Animated.View 
                  style={[
                    styles.wave,
                    { 
                      backgroundColor: isListening ? "#10B981" : "#6366F1",
                      transform: [{ scaleY: Animated.add(0.3, Animated.multiply(waveAnim1, 0.7)) }],
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.wave,
                    { 
                      backgroundColor: isListening ? "#10B981" : "#6366F1",
                      transform: [{ scaleY: Animated.add(0.3, Animated.multiply(waveAnim2, 0.7)) }],
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.wave,
                    { 
                      backgroundColor: isListening ? "#10B981" : "#6366F1",
                      transform: [{ scaleY: Animated.add(0.3, Animated.multiply(waveAnim3, 0.7)) }],
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.wave,
                    { 
                      backgroundColor: isListening ? "#10B981" : "#6366F1",
                      transform: [{ scaleY: Animated.add(0.3, Animated.multiply(waveAnim2, 0.7)) }],
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.wave,
                    { 
                      backgroundColor: isListening ? "#10B981" : "#6366F1",
                      transform: [{ scaleY: Animated.add(0.3, Animated.multiply(waveAnim1, 0.7)) }],
                    }
                  ]} 
                />
              </View>
            )}
            
            {!isListening && !isSpeaking && (
              <View style={styles.idleVisualizer}>
                <Sparkles size={48} color="rgba(255,255,255,0.3)" />
              </View>
            )}
          </View>

          <ScrollView 
            style={styles.transcriptContainer}
            contentContainerStyle={styles.transcriptContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.slice(-4).map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.transcriptBubble,
                  message.role === "user" && styles.userBubble,
                ]}
              >
                <Text style={[
                  styles.transcriptText,
                  message.role === "user" && styles.userText,
                ]}>
                  {message.content}
                </Text>
              </View>
            ))}
            
            {currentTranscript && isProcessing && (
              <View style={[styles.transcriptBubble, styles.userBubble]}>
                <Text style={[styles.transcriptText, styles.userText]}>
                  {currentTranscript}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.endCallButton}
              onPress={handleEndCall}
            >
              <PhoneOff size={28} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonActive,
                isProcessing && styles.micButtonProcessing,
              ]}
              onPress={handleMicPress}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : isListening ? (
                  <MicOff size={40} color="#fff" />
                ) : (
                  <Mic size={40} color="#fff" />
                )}
              </Animated.View>
            </TouchableOpacity>
            
            <View style={styles.placeholderButton} />
          </View>

          <Text style={styles.hintText}>
            {isListening ? "Tap to stop" : isSpeaking ? "AI is responding..." : "Tap the mic to start talking"}
          </Text>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500" as const,
  },
  muteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  visualizerContainer: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 80,
  },
  wave: {
    width: 6,
    height: 60,
    borderRadius: 3,
  },
  idleVisualizer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  transcriptContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  transcriptContent: {
    paddingVertical: 10,
  },
  transcriptBubble: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    maxWidth: "85%",
    alignSelf: "flex-start",
  },
  userBubble: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignSelf: "flex-end",
  },
  transcriptText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  userText: {
    color: "#fff",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  micButtonActive: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },
  micButtonProcessing: {
    backgroundColor: "#F59E0B",
    shadowColor: "#F59E0B",
  },
  placeholderButton: {
    width: 60,
    height: 60,
  },
  hintText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    paddingBottom: Platform.OS === "ios" ? 20 : 30,
  },
});
