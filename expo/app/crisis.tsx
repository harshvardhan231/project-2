import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Phone, Heart, MessageCircle, X } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAnalytics } from "@/providers/AnalyticsProvider";

const CRISIS_HOTLINES = [
  { name: "National Suicide Prevention Lifeline", number: "988", country: "US" },
  { name: "Crisis Text Line", number: "Text HOME to 741741", country: "US" },
  { name: "Samaritans", number: "116 123", country: "UK" },
  { name: "Lifeline", number: "13 11 14", country: "Australia" },
  { name: "Crisis Services Canada", number: "1-833-456-4566", country: "Canada" },
];

export default function CrisisScreen() {
  const { trackCrisisResourcesViewed } = useAnalytics();

  React.useEffect(() => {
    trackCrisisResourcesViewed();
  }, [trackCrisisResourcesViewed]);

  const handleCallHotline = (number: string) => {
    const phoneNumber = number.replace(/[^0-9]/g, "");
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleTextHotline = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("sms:741741&body=HOME");
    } else {
      Linking.openURL("sms:741741?body=HOME");
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Heart size={64} color={colors.white} />
        </View>

        <Text style={styles.title}>We&apos;re Here for You</Text>
        <Text style={styles.subtitle}>
          If you&apos;re in immediate danger, please call your local emergency number (911, 112, 999)
        </Text>

        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Emergency Services</Text>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => handleCallHotline("911")}
          >
            <Phone size={20} color={colors.white} />
            <Text style={styles.emergencyButtonText}>Call Emergency (911)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Crisis Hotlines</Text>
        {CRISIS_HOTLINES.map((hotline, index) => (
          <TouchableOpacity
            key={index}
            style={styles.hotlineCard}
            onPress={() => 
              hotline.number.includes("Text") 
                ? handleTextHotline() 
                : handleCallHotline(hotline.number)
            }
          >
            <View style={styles.hotlineInfo}>
              <Text style={styles.hotlineName}>{hotline.name}</Text>
              <Text style={styles.hotlineNumber}>{hotline.number}</Text>
              <Text style={styles.hotlineCountry}>{hotline.country}</Text>
            </View>
            {hotline.number.includes("Text") ? (
              <MessageCircle size={24} color={colors.primary} />
            ) : (
              <Phone size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.resourcesCard}>
          <Text style={styles.resourcesTitle}>Coping Strategies</Text>
          <Text style={styles.resourcesText}>
            • Take deep, slow breaths{"\n"}
            • Call a trusted friend or family member{"\n"}
            • Go to a safe, comfortable place{"\n"}
            • Focus on the present moment{"\n"}
            • Remember: these feelings will pass
          </Text>
        </View>

        <TouchableOpacity style={styles.returnButton} onPress={handleClose}>
          <Text style={styles.returnButtonText}>Return to App</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.error,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.9,
    lineHeight: 22,
  },
  emergencyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.white,
    marginBottom: 16,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.error,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.white,
    marginBottom: 16,
  },
  hotlineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 4,
  },
  hotlineNumber: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 2,
  },
  hotlineCountry: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resourcesCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.white,
    marginBottom: 12,
  },
  resourcesText: {
    fontSize: 14,
    color: colors.white,
    lineHeight: 22,
    opacity: 0.9,
  },
  returnButton: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  returnButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.error,
  },
});