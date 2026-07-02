import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Calendar, Play, Pause, RotateCcw, Check, Dumbbell, Timer } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Badge } from '../../shared/components/Badge';

export default function StudentTodayScreen() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const router = useRouter();

  // Selected workout index
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Active workout execution states
  const [elapsedSeconds, setElapsedSeconds] = useState(1380); // Starts at 23 mins for realism
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(true);

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(58);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Exercise Checklist State
  const [checkedExercises, setCheckedExercises] = useState<Record<string, boolean>>({
    'we-1': true,
    'we-2': true,
  });

  // Fetch Workouts
  const { data: workouts, isLoading: loadingWorkouts } = useQuery({
    queryKey: ['student-my-workouts-today', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const activeWorkout = workouts?.[selectedIdx];

  // Fetch Workout Exercises
  const { data: exercises, isLoading: loadingExercises } = useQuery({
    queryKey: ['workout-exercises-student-today', activeWorkout?.id],
    queryFn: async () => {
      if (!activeWorkout?.id) return [];
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*, exercises:exercise_id(name, category, description)')
        .eq('workout_id', activeWorkout.id)
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkout?.id,
  });

  // Active workout timer
  useEffect(() => {
    let interval: any = null;
    if (isWorkoutRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutRunning]);

  // Rest Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restSeconds === 0) {
      setIsTimerActive(false);
      Alert.alert(t('student.execution.restTimerFinishedTitle', 'Descanso Concluído'), t('student.execution.restTimerFinishedMessage', 'Hora de iniciar a próxima série!'));
    }
    return () => clearInterval(interval);
  }, [isTimerActive, restSeconds]);

  // Toggle exercise done state
  const toggleExerciseDone = (id: string) => {
    setCheckedExercises((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      // Auto-start rest timer if checking a new exercise
      if (updated[id]) {
        setRestSeconds(60);
        setIsTimerActive(true);
      }
      return updated;
    });
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString()}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  };

  // Find current active exercise (first unchecked one)
  const currentExerciseIndex = exercises?.findIndex((e) => !checkedExercises[e.id]) ?? -1;
  const currentExercise = currentExerciseIndex !== -1 ? exercises?.[currentExerciseIndex] : null;
  const nextExercise = currentExerciseIndex !== -1 && exercises ? exercises[currentExerciseIndex] : null;

  const doneCount = exercises?.filter((e) => checkedExercises[e.id]).length || 0;
  const totalCount = exercises?.length || 0;

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]} 
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="caption" colorType="textDim" style={styles.dateText}>
            {t('student.dashboard.today', 'Hoje')}
          </Typography>
          <Typography variant="h1" style={styles.helloText}>
            {activeWorkout?.week_info || 'Semana 3 de 8'}
          </Typography>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => Alert.alert(t('student.dashboard.calendarTitle', 'Calendário'), t('student.dashboard.calendarMessage', 'Você está em dia com seu cronograma.'))}
          >
            <Calendar size={18} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: theme.primaryDeep, borderColor: theme.primaryColor }]}>
            <Typography variant="bold" style={styles.avatarText}>
              {getInitials(profile?.fullName)}
            </Typography>
          </View>
        </View>
      </View>

      {loadingWorkouts ? (
        <Typography variant="body" colorType="textDim" style={styles.centerText}>
          {t('personal.studentDetail.loadingWorkouts', 'Carregando fichas...')}
        </Typography>
      ) : !activeWorkout ? (
        <Card style={styles.emptyCard}>
          <Dumbbell size={40} color={theme.textMuted} style={{ marginBottom: 12 }} />
          <Typography variant="h2" style={{ textAlign: 'center' }}>{t('student.dashboard.noWorkoutsAvailable', 'Nenhum treino disponível')}</Typography>
          <Typography variant="body" colorType="textDim" style={{ textAlign: 'center', marginTop: 4 }}>
            {t('student.dashboard.contactTrainer', 'Fale com seu personal trainer para liberar sua ficha de treino.')}
          </Typography>
        </Card>
      ) : (
        <>
          {/* Workout hero Card */}
          <Card padding={0} style={styles.heroCard}>
            {/* Top Half - Gradient background simulator */}
            <View style={[styles.heroHeader, { backgroundColor: theme.primaryDeep || theme.primaryColor }]}>
              <View style={styles.heroRow}>
                <View style={styles.heroMeta}>
                  <Typography variant="caption" style={styles.heroLabel}>
                    {t('student.dashboard.workoutOfTheDay', 'TREINO DO DIA')}
                  </Typography>
                  <Typography variant="h1" style={styles.heroTitle}>
                    {activeWorkout.name}
                  </Typography>
                </View>
                <Badge tone="primary" style={styles.heroBadge}>
                  {t('student.dashboard.workoutInProgress', 'EM ANDAMENTO')}
                </Badge>
              </View>

              {/* KPIs */}
              <View style={styles.kpisRow}>
                <View style={styles.kpiCol}>
                  <Typography variant="caption" style={styles.kpiLabel}>{t('personal.exercises.title', 'Exercícios').toUpperCase()}</Typography>
                  <Typography variant="mono" style={styles.kpiVal}>{doneCount}/{totalCount}</Typography>
                </View>
                <View style={styles.kpiCol}>
                  <Typography variant="caption" style={styles.kpiLabel}>{t('student.dashboard.estimatedTimeLabel', 'TEMPO EST.')}</Typography>
                  <Typography variant="mono" style={styles.kpiVal}>{activeWorkout.estimated_time || 50} min</Typography>
                </View>
                <View style={styles.kpiCol}>
                  <Typography variant="caption" style={styles.kpiLabel}>{t('student.dashboard.elapsedTimeLabel', 'DECORRIDO')}</Typography>
                  <Typography variant="mono" style={styles.kpiVal}>{formatTime(elapsedSeconds)}</Typography>
                </View>
              </View>
            </View>

            {/* Bottom Half - Rest Timer */}
            <View style={[styles.restTimerRow, { backgroundColor: theme.surfaceHi }]}>
              {/* Circular Timer Visual */}
              <View style={[styles.restTimerCircle, { borderColor: theme.border }]}>
                <View style={[styles.restProgressRing, { borderColor: theme.primaryColor }]} />
                <Typography variant="mono" style={styles.restTimerText}>
                  {formatTime(restSeconds)}
                </Typography>
              </View>

              {/* Rest Info */}
              <View style={styles.restTimerInfo}>
                <Typography variant="caption" colorType="textMuted" style={{ fontWeight: '700', letterSpacing: 0.5 }}>
                  {t('student.execution.timerLabel', 'Rest Timer').toUpperCase()}
                </Typography>
                <Typography variant="bold" style={styles.nextExText} numberOfLines={1}>
                  {nextExercise ? t('student.execution.nextExercise', 'Próx: {{name}} · {{reps}} reps', { name: nextExercise.exercises?.name, reps: nextExercise.reps }) : t('student.execution.workoutFinished', 'Fim do Treino!')}
                </Typography>
              </View>

              <TouchableOpacity
                style={[styles.pauseBtn, { backgroundColor: theme.primaryColor }]}
                onPress={() => setIsTimerActive(!isTimerActive)}
              >
                {isTimerActive ? (
                  <Pause size={16} color="#000" fill="#000" />
                ) : (
                  <Play size={16} color="#000" fill="#000" style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            </View>
          </Card>

          {/* Sequence Section */}
          <View style={styles.sectionHeader}>
            <Typography variant="mono" colorType="textMuted" style={styles.sectionTitle}>
              {t('student.dashboard.sequenceLabel', 'SEQUÊNCIA')}
            </Typography>
          </View>

          {loadingExercises ? (
            <Typography variant="body" colorType="textDim" style={styles.centerText}>
              {t('personal.studentDetail.loadingExercises', 'Buscando exercícios...')}
            </Typography>
          ) : (
            <View style={styles.exercisesList}>
              {exercises?.map((item, index) => {
                const isDone = !!checkedExercises[item.id];
                const isCurrent = !isDone && (index === currentExerciseIndex || (currentExerciseIndex === -1 && index === 0));

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => toggleExerciseDone(item.id)}
                  >
                    <Card
                      padding={14}
                      style={[
                        styles.exerciseCard,
                        isDone && { opacity: 0.55 },
                        isCurrent && { borderColor: theme.primaryColor, borderWidth: 1 }
                      ]}
                    >
                      <View style={styles.exerciseRow}>
                        {/* Circular Sequence Indicator */}
                        <View style={[
                          styles.seqIndicator,
                          {
                            backgroundColor: isDone 
                              ? theme.success 
                              : isCurrent 
                              ? theme.primaryColor 
                              : theme.surfaceHi,
                            borderColor: isDone || isCurrent ? 'transparent' : theme.border,
                            borderWidth: isDone || isCurrent ? 0 : 1,
                          }
                        ]}>
                          {isDone ? (
                            <Check size={14} color="#000" strokeWidth={2.5} />
                          ) : (
                            <Typography 
                              variant="mono" 
                              style={[
                                styles.seqText, 
                                { color: isCurrent ? '#000' : theme.textMuted }
                              ]}
                            >
                              {index + 1}
                            </Typography>
                          )}
                        </View>

                        {/* Exercise Name & Specs */}
                        <View style={styles.exerciseDetails}>
                          <Typography 
                            variant="bold" 
                            style={[
                              styles.exerciseName, 
                              isDone && { textDecorationLine: 'line-through' }
                            ]}
                          >
                            {item.exercises?.name}
                          </Typography>
                          <View style={styles.specsRow}>
                            <Typography variant="mono" colorType="textDim" style={styles.specsText}>
                              {item.sets} × {item.reps}
                            </Typography>
                            <Typography variant="mono" colorType="textDim" style={styles.specsDivider}>·</Typography>
                            <Typography variant="mono" colorType="textDim" style={styles.specsText}>
                              {item.rest_seconds}s
                            </Typography>
                            {item.load && (
                              <>
                                <Typography variant="mono" colorType="textDim" style={styles.specsDivider}>·</Typography>
                                <Typography variant="mono" colorType="primary" style={[styles.specsText, { fontWeight: '700' }]}>
                                  {item.load}kg
                                </Typography>
                              </>
                            )}
                          </View>
                        </View>

                        {/* Iniciar Button for current exercise */}
                        {isCurrent && (
                          <TouchableOpacity
                            style={[styles.iniciarBtn, { backgroundColor: theme.primaryColor }]}
                            onPress={() => router.push({
                              pathname: '/(student)/workout-execution',
                              params: { workoutId: activeWorkout.id, workoutName: activeWorkout.name }
                            })}
                          >
                            <Typography variant="bold" style={styles.iniciarBtnText}>
                              {t('common.start', 'Iniciar')}
                            </Typography>
                          </TouchableOpacity>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  helloText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  centerText: {
    textAlign: 'center',
    marginVertical: 40,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 16,
  },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
  },
  heroHeader: {
    padding: 18,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroMeta: {
    flex: 1,
    marginRight: 10,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    opacity: 0.85,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  kpisRow: {
    flexDirection: 'row',
    gap: 20,
  },
  kpiCol: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    opacity: 0.7,
    marginBottom: 2,
    color: '#FFFFFF',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  restTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  restTimerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  restProgressRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    top: -3,
    left: -3,
  },
  restTimerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  restTimerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nextExText: {
    fontSize: 13,
    marginTop: 2,
  },
  pauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  exercisesList: {
    gap: 8,
  },
  exerciseCard: {
    marginVertical: 0,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  seqIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seqText: {
    fontSize: 11,
    fontWeight: '700',
  },
  exerciseDetails: {
    flex: 1,
    minWidth: 0,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specsText: {
    fontSize: 11.5,
  },
  specsDivider: {
    fontSize: 11.5,
  },
  iniciarBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iniciarBtnText: {
    fontSize: 12,
    color: '#000000',
  },
});
