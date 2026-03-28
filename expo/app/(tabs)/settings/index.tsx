import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Modal,
  Platform,
} from "react-native";
import { router } from "expo-router";
import {
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  ChevronRight,
  Volume2,
  HelpCircle,
  Lock,
  Eye,
  Server,
  Smartphone,
  X,
  Check,
} from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useUser } from "@/providers/UserProvider";
import { useAudio } from "@/providers/AudioProvider";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";

export default function SettingsScreen() {
  const { user, privacyMode, setPrivacyMode, clearAllData } = useUser();
  const { isMusicEnabled, setMusicEnabled } = useAudio();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDataDetails, setShowDataDetails] = useState(false);

  const handleExport = () => {
    router.push("/export" as any);
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your journal entries and check-ins. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            Alert.alert("Success", "All data has been deleted");
          },
        },
      ]
    );
  };

  const handlePrivacyModeChange = (value: boolean) => {
    const mode = value ? "client" : "server";
    Alert.alert(
      value ? "Enable Client Mode" : "Enable Server Mode",
      value
        ? "Client mode stores all data locally. You won't receive AI summaries."
        : "Server mode allows AI features but requires sending messages for processing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Enable",
          onPress: () => setPrivacyMode(mode),
        },
      ]
    );
  };

  const renderPrivacyModal = () => (
    <Modal
      visible={showPrivacyModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Your Privacy Matters</Text>
          <TouchableOpacity 
            onPress={() => setShowPrivacyModal(false)}
            style={styles.closeButton}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.privacyItem}>
            <View style={styles.privacyIconContainer}>
              <Smartphone size={24} color="#10B981" />
            </View>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyItemTitle}>
                <Check size={16} color="#10B981" /> Conversations stay on YOUR device
              </Text>
              <Text style={styles.privacyItemDesc}>
                Your journal entries and mood logs are stored locally, not on our servers.
              </Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <View style={styles.privacyIconContainer}>
              <Lock size={24} color="#10B981" />
            </View>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyItemTitle}>
                <Check size={16} color="#10B981" /> Journals are private & local
              </Text>
              <Text style={styles.privacyItemDesc}>
                Only you can read your journal entries. They never leave your device unless you export them.
              </Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <View style={styles.privacyIconContainer}>
              <Server size={24} color="#6366F1" />
            </View>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyItemTitle}>
                <Check size={16} color="#6366F1" /> AI processes your message
              </Text>
              <Text style={styles.privacyItemDesc}>
                When you chat, your message is sent to our AI for a response, but your identity is not stored.
              </Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <View style={styles.privacyIconContainer}>
              <Download size={24} color="#10B981" />
            </View>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyItemTitle}>
                <Check size={16} color="#10B981" /> Export or delete anytime
              </Text>
              <Text style={styles.privacyItemDesc}>
                You own your data. Export it as a file or permanently delete it whenever you want.
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => setShowDataDetails(!showDataDetails)}
          >
            <Eye size={20} color="#6366F1" />
            <Text style={styles.detailsButtonText}>
              {showDataDetails ? "Hide details" : "See what data is stored"}
            </Text>
            <ChevronRight 
              size={20} 
              color="#6366F1" 
              style={{ transform: [{ rotate: showDataDetails ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showDataDetails && (
            <View style={styles.dataDetailsContainer}>
              <Text style={styles.dataDetailsTitle}>What&apos;s stored on your device:</Text>
              <Text style={styles.dataDetailItem}>• Journal entries (text only)</Text>
              <Text style={styles.dataDetailItem}>• Mood logs (emoji + date)</Text>
              <Text style={styles.dataDetailItem}>• Chat history (last 30 days)</Text>
              <Text style={styles.dataDetailItem}>• Your preferences</Text>

              <Text style={[styles.dataDetailsTitle, { marginTop: 16 }]}>What&apos;s NOT stored:</Text>
              <Text style={styles.dataDetailItem}>• Your real name or email</Text>
              <Text style={styles.dataDetailItem}>• Location data</Text>
              <Text style={styles.dataDetailItem}>• Contacts</Text>
              <Text style={styles.dataDetailItem}>• Other app data</Text>

              <Text style={[styles.dataDetailsTitle, { marginTop: 16 }]}>What&apos;s sent to AI:</Text>
              <Text style={styles.dataDetailItem}>• Your message text</Text>
              <Text style={styles.dataDetailItem}>• Context (last few messages)</Text>

              <Text style={[styles.dataDetailsTitle, { marginTop: 16 }]}>What&apos;s NOT sent:</Text>
              <Text style={styles.dataDetailItem}>• Your identity</Text>
              <Text style={styles.dataDetailItem}>• Your full history</Text>
              <Text style={styles.dataDetailItem}>• Any metadata</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity 
          style={styles.gotItButton}
          onPress={() => setShowPrivacyModal(false)}
        >
          <Text style={styles.gotItButtonText}>Got it</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>You</Text>
          </View>

          <GlassCard style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#6366F1" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || "User"}</Text>
              <Text style={styles.profileSubtext}>Tap to edit profile</Text>
            </View>
            <ChevronRight size={20} color={colors.gray} />
          </GlassCard>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
            <GlassCard style={styles.sectionCard}>
              <TouchableOpacity 
                style={styles.item}
                onPress={() => setShowPrivacyModal(true)}
              >
                <View style={[styles.iconContainer, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                  <Shield size={20} color="#10B981" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Your Privacy</Text>
                  <Text style={styles.itemSubtitle}>Learn how your data is protected</Text>
                </View>
                <ChevronRight size={20} color={colors.gray} />
              </TouchableOpacity>

              <View style={styles.itemDivider} />

              <View style={styles.item}>
                <View style={[styles.iconContainer, { backgroundColor: "rgba(99, 102, 241, 0.1)" }]}>
                  <Lock size={20} color="#6366F1" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Client-Only Mode</Text>
                  <Text style={styles.itemSubtitle}>
                    {privacyMode === "client" ? "AI features disabled" : "AI features enabled"}
                  </Text>
                </View>
                <Switch
                  value={privacyMode === "client"}
                  onValueChange={handlePrivacyModeChange}
                  trackColor={{ false: colors.lightGray, true: "#6366F1" }}
                  thumbColor="#fff"
                />
              </View>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.item}>
                <View style={[styles.iconContainer, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
                  <Bell size={20} color="#F59E0B" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Notifications</Text>
                  <Text style={styles.itemSubtitle}>Daily reminders</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: colors.lightGray, true: "#6366F1" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.itemDivider} />

              <View style={styles.item}>
                <View style={[styles.iconContainer, { backgroundColor: "rgba(6, 182, 212, 0.1)" }]}>
                  <Volume2 size={20} color="#06B6D4" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Background Music</Text>
                  <Text style={styles.itemSubtitle}>Calming sounds</Text>
                </View>
                <Switch
                  value={isMusicEnabled}
                  onValueChange={setMusicEnabled}
                  trackColor={{ false: colors.lightGray, true: "#6366F1" }}
                  thumbColor="#fff"
                />
              </View>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <GlassCard style={styles.sectionCard}>
              <TouchableOpacity style={styles.item} onPress={handleExport}>
                <View style={[styles.iconContainer, { backgroundColor: "rgba(99, 102, 241, 0.1)" }]}>
                  <Download size={20} color="#6366F1" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Export Data</Text>
                  <Text style={styles.itemSubtitle}>Download your journal as JSON</Text>
                </View>
                <ChevronRight size={20} color={colors.gray} />
              </TouchableOpacity>

              <View style={styles.itemDivider} />

              <TouchableOpacity style={styles.item} onPress={handleDeleteData}>
                <View style={[styles.iconContainer, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                  <Trash2 size={20} color="#EF4444" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, { color: "#EF4444" }]}>
                    Delete All Data
                  </Text>
                  <Text style={styles.itemSubtitle}>Permanently remove everything</Text>
                </View>
                <ChevronRight size={20} color={colors.gray} />
              </TouchableOpacity>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <GlassCard style={styles.sectionCard}>
              <TouchableOpacity style={styles.item}>
                <View style={[styles.iconContainer, { backgroundColor: "rgba(99, 102, 241, 0.1)" }]}>
                  <HelpCircle size={20} color="#6366F1" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Help & Support</Text>
                  <Text style={styles.itemSubtitle}>Get assistance</Text>
                </View>
                <ChevronRight size={20} color={colors.gray} />
              </TouchableOpacity>
            </GlassCard>
          </View>

          <View style={styles.footer}>
            <Text style={styles.version}>Version 2.0.0</Text>
            <Text style={styles.disclaimer}>
              This app is not a substitute for professional medical advice, diagnosis, or treatment.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {renderPrivacyModal()}
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#1A1A1A",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 2,
  },
  profileSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: "#1A1A1A",
    marginBottom: 2,
    fontWeight: "500" as const,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginHorizontal: 12,
  },
  footer: {
    padding: 20,
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 100 : 80,
  },
  version: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F5FFFA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1A1A1A",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  privacyItem: {
    flexDirection: "row",
    marginBottom: 24,
  },
  privacyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  privacyItemDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    marginTop: 8,
  },
  detailsButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#6366F1",
    fontWeight: "500" as const,
    marginLeft: 12,
  },
  dataDetailsContainer: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  dataDetailsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 8,
  },
  dataDetailItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    paddingLeft: 8,
  },
  gotItButton: {
    backgroundColor: "#6366F1",
    marginHorizontal: 20,
    marginBottom: Platform.OS === "ios" ? 34 : 20,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  gotItButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});