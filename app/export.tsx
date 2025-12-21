import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Download, FileJson, FileText, X } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useJournal } from "@/providers/JournalProvider";
import { useAnalytics } from "@/providers/AnalyticsProvider";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function ExportScreen() {
  const { entries, checkins } = useJournal();
  const { trackDataExported } = useAnalytics();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        entries: entries,
        checkins: checkins,
      };

      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `breath-happiness-export-${Date.now()}.json`;
      
      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        await Sharing.shareAsync(fileUri);
      }

      trackDataExported();
      Alert.alert("Success", "Your data has been exported");
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    Alert.alert("Coming Soon", "PDF export will be available in the next update");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Export Your Data</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Download size={32} color={colors.primary} />
          <Text style={styles.infoTitle}>Download Your Journal</Text>
          <Text style={styles.infoText}>
            Export all your journal entries, check-ins, and reflections
          </Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Data</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Journal Entries:</Text>
            <Text style={styles.statValue}>{entries.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Check-ins:</Text>
            <Text style={styles.statValue}>{checkins.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Reflections:</Text>
            <Text style={styles.statValue}>{entries.length + checkins.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Export Format</Text>

        <TouchableOpacity
          style={[styles.exportOption, isExporting && styles.optionDisabled]}
          onPress={handleExportJSON}
          disabled={isExporting}
        >
          <FileJson size={24} color={colors.primary} />
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>JSON Format</Text>
            <Text style={styles.optionDescription}>
              Machine-readable format for data backup
            </Text>
          </View>
          {isExporting && <ActivityIndicator size="small" color={colors.primary} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exportOption}
          onPress={handleExportPDF}
        >
          <FileText size={24} color={colors.gray} />
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, { color: colors.gray }]}>
              PDF Format
            </Text>
            <Text style={styles.optionDescription}>
              Coming soon - formatted for reading
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyNoteText}>
            Your exported data is stored locally on your device. 
            We do not have access to exported files.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 16,
  },
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionContent: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  privacyNote: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  privacyNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});