import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Badge } from '../../shared/components/Badge';
import { Bell, Users, Flame, Sparkles, Clock, ChevronRight, Info } from 'lucide-react-native';

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const router = useRouter();

  // Fetch actual student count from Supabase
  const { data: students } = useQuery({
    queryKey: ['personal-students-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('personal_id', profile.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const activeStudentsCount = students?.filter((s: any) => s.status === 'active').length || 0;
  // Fallback to prototype mockup default (14) if no students are registered yet
  const displayActiveCount = activeStudentsCount > 0 ? activeStudentsCount : 14;

  const formattedDate = 'terça-feira, 20 de maio'; // Mocked to match the exact design mockup

  // Iniciais para avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  };

  // Alertas mockados fiéis ao design
  const alertsList = [
    { id: 1, type: 'expiring', text: t('personal.dashboard.alertExpiring', 'Ficha da Mariana Costa expira em 3 dias'), severity: 'warn' },
    { id: 2, type: 'inactive', text: t('personal.dashboard.alertInactive', '1 aluno sem treinar há +5 dias'), severity: 'danger' },
    { id: 3, type: 'new', text: t('personal.dashboard.alertNewRequest', 'Nova solicitação de cadastro recebida'), severity: 'primary' },
  ];

  // Agenda de treinos de hoje idêntica ao design
  const todaySchedule = [
    { time: '07:00', name: 'Mariana Costa', plan: t('personal.dashboard.schedule1', 'Treino A · Peito + Tríceps'), tone: 'primary' },
    { time: '09:30', name: 'João Pereira', plan: t('personal.dashboard.schedule2', 'Full body · cargas'), tone: 'neutral' },
    { time: '14:00', name: 'Camila Souza', plan: t('personal.dashboard.schedule3', 'Treino C · Pernas'), tone: 'neutral' },
    { time: '18:00', name: 'Beatriz Lima', plan: t('personal.dashboard.schedule4', 'Avaliação trimestral'), tone: 'success' },
  ];

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
            {t('student.dashboard.welcome', { name: profile?.fullName?.split(' ')[0] || 'Rafael' })}
          </Typography>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.bellButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => Alert.alert(t('personal.dashboard.alertTitle', 'Novos Feedbacks'), t('personal.dashboard.notificationMessage', 'Você tem 1 novo alerta de atenção.'))}
          >
            <Bell size={18} color={theme.text} />
            <View style={[styles.bellBadge, { backgroundColor: theme.primaryColor, borderColor: theme.surface }]} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: theme.primaryDeep, borderColor: theme.primaryColor }]}>
            <Typography variant="bold" style={styles.avatarText}>
              {profile?.fullName ? getInitials(profile.fullName) : 'PT'}
            </Typography>
          </View>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={styles.statCardWrapper}
          onPress={() => router.push('/(personal)/students')}
        >
          <Card padding={16} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
                <Users size={14} color={theme.primaryColor} />
              </View>
              <Typography variant="caption" colorType="textDim" style={{ fontWeight: '500' }}>{t('personal.dashboard.statsStudents')}</Typography>
            </View>
            <Typography variant="mono" style={styles.statValue}>{displayActiveCount}</Typography>
            <Typography variant="caption" colorType="success" style={styles.trend}>+2 {t('personal.dashboard.thisMonth', 'este mês')}</Typography>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCardWrapper}
          onPress={() => router.push('/(personal)/workouts')}
        >
          <Card padding={16} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                <Flame size={14} color={theme.textDim} />
              </View>
              <Typography variant="caption" colorType="textDim" style={{ fontWeight: '500' }}>{t('personal.dashboard.statsWorkouts')}</Typography>
            </View>
            <Typography variant="mono" style={styles.statValue}>58</Typography>
            <Typography variant="caption" colorType="success" style={styles.trend}>+12% vs. {t('personal.dashboard.previous', 'anterior')}</Typography>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCardWrapper}
          onPress={() => router.push('/(personal)/students')}
        >
          <Card padding={16} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                <Sparkles size={14} color={theme.textDim} />
              </View>
              <Typography variant="caption" colorType="textDim" style={{ fontWeight: '500' }}>{t('personal.dashboard.statsNewRegistrations', 'Novos cadastros')}</Typography>
            </View>
            <Typography variant="mono" style={styles.statValue}>3</Typography>
            <Typography variant="caption" colorType="primary" style={styles.trend}>{t('personal.dashboard.thisWeek', 'esta semana')}</Typography>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCardWrapper}
          onPress={() => router.push('/(personal)/students')}
        >
          <Card padding={16} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                <Clock size={14} color={theme.textDim} />
              </View>
              <Typography variant="caption" colorType="textDim" style={{ fontWeight: '500' }}>{t('personal.dashboard.statsExpiringWorkouts', 'Fichas expirando')}</Typography>
            </View>
            <Typography variant="mono" style={styles.statValue}>2</Typography>
            <Typography variant="caption" colorType="warn" style={styles.trend}>{t('personal.dashboard.next7days', 'próx. 7 dias')}</Typography>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Seção Atenção */}
      <View style={styles.sectionHeader}>
        <Typography variant="mono" colorType="textMuted" style={styles.sectionTitle}>
          {t('personal.dashboard.attention', 'ATENÇÃO')}
        </Typography>
        <Typography variant="caption" colorType="primary" style={styles.seeAll}>
          {t('personal.dashboard.seeAll', 'Ver tudo')}
        </Typography>
      </View>

      <View style={styles.alertsContainer}>
        {alertsList.map((alert) => (
          <Card key={alert.id} padding={14} style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View style={[
                styles.alertIconBg, 
                { 
                  backgroundColor: alert.severity === 'danger' 
                    ? 'rgba(244,98,92,0.12)' 
                    : alert.severity === 'warn' 
                    ? 'rgba(244,178,59,0.12)' 
                    : theme.primarySoft 
                }
              ]}>
                {alert.type === 'expiring' ? (
                  <Clock size={16} color={alert.severity === 'warn' ? theme.warn : theme.primaryColor} />
                ) : alert.type === 'inactive' ? (
                  <Info size={16} color={alert.severity === 'danger' ? theme.danger : theme.textDim} />
                ) : (
                  <Sparkles size={16} color={theme.primaryColor} />
                )}
              </View>
              <Typography variant="bold" style={styles.alertText}>
                {alert.text}
              </Typography>
              <ChevronRight size={16} color={theme.textMuted} />
            </View>
          </Card>
        ))}
      </View>

      {/* Seção Agenda Diária */}
      <View style={styles.sectionHeader}>
        <Typography variant="mono" colorType="textMuted" style={styles.sectionTitle}>
          {t('personal.dashboard.todaySchedule', 'HOJE · 4 SESSÕES PREVISTAS')}
        </Typography>
      </View>

      <View style={styles.scheduleContainer}>
        {todaySchedule.map((s, index) => (
          <Card key={index} padding={14} style={styles.scheduleCard}>
            <View style={styles.scheduleRow}>
              <Typography variant="mono" style={styles.scheduleTime}>
                {s.time}
              </Typography>
              <View style={[styles.avatarSmall, { backgroundColor: theme.surfaceHi }]}>
                <Typography variant="bold" style={styles.avatarSmallText}>
                  {getInitials(s.name)}
                </Typography>
              </View>
              <View style={styles.scheduleInfo}>
                <Typography variant="bold" style={styles.scheduleStudentName}>
                  {s.name}
                </Typography>
                <Typography variant="caption" colorType="textDim">
                  {s.plan}
                </Typography>
              </View>
              {s.tone === 'primary' ? (
                <Badge tone="primary" dot>{t('personal.dashboard.badgeNow', 'agora')}</Badge>
              ) : s.tone === 'success' ? (
                <Badge tone="success">{t('personal.dashboard.badgeEvaluation', 'avaliação')}</Badge>
              ) : null}
            </View>
          </Card>
        ))}
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
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertsContainer: {
    gap: 8,
    marginBottom: 24,
  },
  alertCard: {
    marginVertical: 0,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  scheduleContainer: {
    gap: 8,
  },
  scheduleCard: {
    marginVertical: 0,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 48,
    letterSpacing: -0.4,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6', // Purple hue default
  },
  avatarSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleStudentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
});
