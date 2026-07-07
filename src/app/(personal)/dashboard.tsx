import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Users, Flame, Sparkles, Clock } from 'lucide-react-native';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface DashboardMetrics {
  students: number;
  workouts: number;
  newThisWeek: number;
  activeSheets: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const router = useRouter();

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ['personal-dashboard-metrics', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { students: 0, workouts: 0, newThisWeek: 0, activeSheets: 0 };
      const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();
      // Contagens via head+count: não trazem linhas, só o total.
      const [studentsRes, workoutsRes, newRes, activeRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('personal_id', profile.id).eq('role', 'student'),
        supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('personal_id', profile.id),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('personal_id', profile.id).eq('role', 'student').gte('created_at', weekAgo),
        supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('personal_id', profile.id).eq('is_active', true),
      ]);
      return {
        students: studentsRes.count || 0,
        workouts: workoutsRes.count || 0,
        newThisWeek: newRes.count || 0,
        activeSheets: activeRes.count || 0,
      };
    },
    enabled: !!profile?.id,
  });

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const firstName = profile?.fullName?.split(' ')[0] || '';

  const getInitials = (name: string) =>
    name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Typography variant="caption" colorType="textDim" style={styles.subtitle}>
            {formattedDate}
          </Typography>
          <Typography variant="h1" style={styles.title}>
            {t('student.dashboard.welcome', { name: firstName })}
          </Typography>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryDeep, borderColor: theme.primaryColor }]}>
            <Typography variant="bold" style={styles.avatarText}>
              {profile?.fullName ? getInitials(profile.fullName) : 'PT'}
            </Typography>
          </View>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/(personal)/students')}>
          <Card padding={16} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
                <Users size={14} color={theme.primaryColor} />
              </View>
              <Typography variant="caption" colorType="textDim" style={{ fontWeight: '500' }}>{t('personal.dashboard.statsStudents')}</Typography>
            </View>
            <Typography variant="mono" style={styles.statValue}>{metrics?.students ?? 0}</Typography>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/(personal)/workouts')}>
          <Card padding={16} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                <Flame size={14} color={theme.textDim} />
              </View>
              <Typography variant="caption" colorType="textDim" style={{ fontWeight: '500' }}>{t('personal.dashboard.statsWorkouts')}</Typography>
            </View>
            <Typography variant="mono" style={styles.statValue}>{metrics?.workouts ?? 0}</Typography>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/(personal)/students')}>
          <Card padding={16} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                <Sparkles size={14} color={theme.textDim} />
              </View>
              <Typography variant="caption" colorType="textDim" style={{ fontWeight: '500' }}>{t('personal.dashboard.statsNewRegistrations', 'Novos cadastros')}</Typography>
            </View>
            <Typography variant="mono" style={styles.statValue}>{metrics?.newThisWeek ?? 0}</Typography>
            <Typography variant="caption" colorType="primary" style={styles.trend}>{t('personal.dashboard.thisWeek', 'esta semana')}</Typography>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/(personal)/workouts')}>
          <Card padding={16} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                <Clock size={14} color={theme.textDim} />
              </View>
              <Typography variant="caption" colorType="textDim" style={{ fontWeight: '500' }}>{t('personal.dashboard.statsActiveSheets', 'Fichas ativas')}</Typography>
            </View>
            <Typography variant="mono" style={styles.statValue}>{metrics?.activeSheets ?? 0}</Typography>
          </Card>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCardWrapper: {
    width: '48.5%',
  },
  statCard: {
    marginVertical: 0,
    width: '100%',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  trend: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
});
