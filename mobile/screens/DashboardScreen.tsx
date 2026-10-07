import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';
import { Colors, Typography, Spacing, Radius } from '../theme/tokens';
import type { Project } from '../lib/database.types';

// ─── Status badge ────────────────────────────────────────────────
const STATUS_LABELS: Record<Project['status'], string> = {
  draft:     'Draft',
  active:    'Active',
  on_hold:   'On Hold',
  completed: 'Completed',
  archived:  'Archived',
};

function StatusBadge({ status }: { status: Project['status'] }) {
  const palette = Colors.status[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

// ─── Project card ────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const start = project.start_date
    ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;
  const end = project.end_date
    ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {project.name}
        </Text>
        <StatusBadge status={project.status} />
      </View>
      {project.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {project.description}
        </Text>
      ) : null}
      <View style={styles.cardMeta}>
        {start ? (
          <Text style={styles.metaText}>📅 {start}{end ? ` → ${end}` : ''}</Text>
        ) : null}
        {project.budget_hours ? (
          <Text style={styles.metaText}>⏱ {project.budget_hours.toLocaleString()} hrs</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Dashboard screen ────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, clearAuth } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setProjects(data ?? []);
    }
  }, []);

  useEffect(() => {
    fetchProjects().finally(() => setLoading(false));
  }, [fetchProjects]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.full_name?.split(' ')[0] ?? 'there';

  const activeCount   = projects.filter((p) => p.status === 'active').length;
  const draftCount    = projects.filter((p) => p.status === 'draft').length;
  const totalBudget   = projects.reduce((acc, p) => acc + (p.budget_hours ?? 0), 0);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProjectCard project={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Top bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>{greeting()}, {displayName}</Text>
                <Text style={styles.subGreeting}>Here's your project overview</Text>
              </View>
              <TouchableOpacity style={styles.avatarBtn} onPress={handleSignOut}>
                <Text style={styles.avatarText}>
                  {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{projects.length}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>{activeCount}</Text>
                <Text style={styles.summaryLabel}>Active</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>{draftCount}</Text>
                <Text style={styles.summaryLabel}>Draft</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalBudget.toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Budget hrs</Text>
              </View>
            </View>

            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projects</Text>
            </View>

            {/* Loading / Error states */}
            {loading && (
              <View style={styles.centred}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading projects…</Text>
              </View>
            )}
            {!loading && error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Failed to load projects</Text>
                <Text style={styles.errorMsg}>{error}</Text>
                <TouchableOpacity onPress={fetchProjects} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyMsg}>
                Projects you're a member of will appear here.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[8] },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[5],
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  subGreeting: {
    fontSize: Typography.sizes.sm,
    color: Colors.muted,
    marginTop: 2,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryFg,
  },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  summaryLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginTop: 2,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
  },

  // Project card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
    gap: Spacing[2],
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
  },
  cardDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: Spacing[3],
  },
  cardMeta: { flexDirection: 'row', gap: Spacing[4], flexWrap: 'wrap' },
  metaText: { fontSize: Typography.sizes.xs, color: Colors.muted },

  // Badge
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },

  // States
  centred: { alignItems: 'center', paddingVertical: Spacing[8] },
  loadingText: { marginTop: Spacing[3], fontSize: Typography.sizes.sm, color: Colors.muted },

  errorBox: {
    backgroundColor: '#2d0a0a',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: '#7f1d1d',
    marginBottom: Spacing[4],
  },
  errorTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.danger,
    marginBottom: Spacing[1],
  },
  errorMsg: { fontSize: Typography.sizes.sm, color: Colors.muted, marginBottom: Spacing[3] },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.danger,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  retryText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryFg,
  },

  emptyBox: { alignItems: 'center', paddingVertical: Spacing[12] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing[4] },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    marginBottom: Spacing[2],
  },
  emptyMsg: {
    fontSize: Typography.sizes.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
