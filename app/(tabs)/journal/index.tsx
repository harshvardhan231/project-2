import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Plus, Search, Tag, Sparkles, BookOpen } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useJournal } from "@/providers/JournalProvider";
import { JournalEntryCard } from "@/components/JournalEntryCard";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";

export default function JournalScreen() {
  const { entries, isLoading } = useJournal();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(entry =>
        entry.tags.includes(selectedTag)
      );
    }
    
    return filtered;
  }, [entries, searchQuery, selectedTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [entries]);

  const handleNewEntry = () => {
    router.push("/(tabs)/journal/new" as any);
  };

  const handleEntryPress = (id: string) => {
    router.push(`/(tabs)/journal/${id}` as any);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <GlassCard style={styles.emptyCard}>
        <View style={styles.emptyIconContainer}>
          <BookOpen size={48} color="#6366F1" />
        </View>
        <Text style={styles.emptyTitle}>Your first reflection starts here</Text>
        <Text style={styles.emptyText}>
          Try writing about:
        </Text>
        <View style={styles.suggestionList}>
          <Text style={styles.suggestionItem}>• How you&apos;re feeling today</Text>
          <Text style={styles.suggestionItem}>• Something you&apos;re grateful for</Text>
          <Text style={styles.suggestionItem}>• A moment that mattered</Text>
        </View>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={handleNewEntry}
        >
          <Sparkles size={18} color="#fff" />
          <Text style={styles.emptyButtonText}>Start writing</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Journal</Text>
        </View>

        <GlassCard style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search entries..."
              placeholderTextColor={colors.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="search-input"
            />
          </View>
        </GlassCard>

        {allTags.length > 0 && (
          <View style={styles.tagsContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={allTags}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tagChip,
                    selectedTag === item && styles.tagChipActive,
                  ]}
                  onPress={() => setSelectedTag(selectedTag === item ? null : item)}
                >
                  <Tag size={12} color={selectedTag === item ? colors.white : "#6366F1"} />
                  <Text style={[
                    styles.tagText,
                    selectedTag === item && styles.tagTextActive,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.tagsList}
            />
          </View>
        )}

        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.entryWrapper}>
              <JournalEntryCard
                entry={item}
                onPress={() => handleEntryPress(item.id)}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
        />

        {entries.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handleNewEntry}
            activeOpacity={0.8}
          >
            <Plus size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </SafeAreaView>
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
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1A1A1A",
  },
  tagsContainer: {
    height: 44,
    marginBottom: 8,
  },
  tagsList: {
    paddingHorizontal: 20,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  tagChipActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  tagText: {
    fontSize: 13,
    color: "#6366F1",
    marginLeft: 6,
    fontWeight: "500" as const,
  },
  tagTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 140 : 120,
  },
  entryWrapper: {
    marginBottom: 12,
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: 40,
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#1A1A1A",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  suggestionList: {
    alignSelf: "stretch",
    marginBottom: 24,
  },
  suggestionItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 24,
    paddingLeft: 16,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: Platform.OS === "ios" ? 110 : 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});