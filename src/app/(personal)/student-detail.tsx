import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageSquare, MoreHorizontal, FileText, ChevronRight, Send, Plus, ChevronDown, ChevronUp, Check, Calendar, Camera } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';

type SubTabKey = 'atual' | 'antigas' | 'evolucao' | 'coment';
type ModalStep = 1 | 2 | 3;

interface ExerciseConfig {
  exerciseId: string;
  name: string;
  sets: string;
  reps: string;
  load: string;
  restSeconds: string;
  expanded: boolean;
}

export default function StudentDetail() {
  const { studentId, studentName } = useLocalSearchParams<{ studentId: string; studentName: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { profile: personalProfile } = useAuthStore();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('atual');

  // Modal para criação de ficha
  const [fichaModalVisible, setFichaModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [step, setStep] = useState<ModalStep>(1);
  const [fichaName, setFichaName] = useState('');
  const [fichaDivision, setFichaDivision] = useState('A');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [exerciseConfigs, setExerciseConfigs] = useState<readonly ExerciseConfig[]>([]);

  // Comentários & Feedbacks
  const [commentText, setCommentText] = useState('');

  // 1. Busca perfil do Aluno
  const { data: student } = useQuery({
    queryKey: ['student-profile-detail', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // 2. Busca fichas de treino (workouts)
  const { data: workouts, isLoading: workoutsLoading } = useQuery({
    queryKey: ['student-detail-workouts', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // 3. Busca contagem de exercícios por ficha
  const { data: exerciseCounts } = useQuery({
    queryKey: ['student-detail-workout-counts', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('workout_id');
      if (error) throw error;
      return (data || []).reduce<Record<string, number>>((acc, row: any) => {
        acc[row.workout_id] = (acc[row.workout_id] || 0) + 1;
        return acc;
      }, {});
    },
    enabled: !!studentId,
  });

  // 4. Busca todos os exercícios para o modal
  const { data: allExercises } = useQuery({
    queryKey: ['exercises-for-creation', personalProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`personal_id.is.null,personal_id.eq.${personalProfile?.id}`)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!personalProfile?.id,
  });

  // 5. Busca templates
  const { data: templates } = useQuery({
    queryKey: ['student-templates-list', personalProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('personal_id', personalProfile?.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!personalProfile?.id,
  });

  // 6. Busca medições do aluno (medidas corporais)
  const { data: measurements } = useQuery({
    queryKey: ['student-measurements', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('student_measurements')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // 7. Busca documentos PDF do aluno
  const { data: documents } = useQuery({
    queryKey: ['student-documents', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // 6. Busca progresso do aluno
  const { data: progressItems, isLoading: progressLoading } = useQuery({
    queryKey: ['student-detail-progress', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // 7. Busca comentários
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['student-detail-comments', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_comments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // MUTAÇÕES
  const createFichaMutation = useMutation({
    mutationFn: async () => {
      if (!fichaName.trim()) throw new Error(t('personal.studentDetail.workoutNameRequired', 'Nome da ficha é obrigatório.'));
      if (exerciseConfigs.length === 0) throw new Error(t('personal.studentDetail.selectAtLeastOneExercise', 'Selecione ao menos um exercício.'));

      const { data: workout, error: wError } = await supabase
        .from('workouts')
        .insert({ student_id: studentId, name: fichaName.trim(), division: fichaDivision })
        .select()
        .single();
      if (wError) throw wError;

      const rows = exerciseConfigs.map((cfg, idx) => ({
        workout_id: workout.id,
        exercise_id: cfg.exerciseId,
        sets: parseInt(cfg.sets, 10) || 3,
        reps: cfg.reps || '12',
        load: cfg.load ? parseFloat(cfg.load) : null,
        rest_seconds: parseInt(cfg.restSeconds, 10) || 60,
        sequence_order: idx,
      }));

      const { error: exError } = await supabase.from('workout_exercises').insert(rows);
      if (exError) throw exError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail-workouts', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-detail-workout-counts', studentId] });
      Alert.alert(t('common.success', 'Sucesso'), t('personal.studentDetail.workoutCreated', 'Ficha criada com sucesso!'));
      resetFichaModal();
    },
    onError: (err: any) => {
      Alert.alert(t('personal.studentDetail.errorCreatingWorkout', 'Erro ao criar ficha'), err.message || t('personal.studentDetail.unexpectedError', 'Erro inesperado.'));
    },
  });

  const sendCommentMutation = useMutation({
    mutationFn: async () => {
      if (!commentText.trim()) throw new Error(t('personal.studentDetail.commentRequired', 'Comentário vazio.'));
      const { error } = await supabase.from('student_comments').insert({
        student_id: studentId,
        personal_id: personalProfile?.id,
        author_role: 'personal',
        author_name: personalProfile?.fullName || 'Personal',
        message: commentText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail-comments', studentId] });
      setCommentText('');
    },
    onError: (err: any) => {
      Alert.alert(t('personal.studentDetail.errorSendingComment', 'Erro ao enviar'), err.message);
    },
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  };

  const resetFichaModal = () => {
    setFichaModalVisible(false);
    setStep(1);
    setFichaName('');
    setFichaDivision('A');
    setSelectedIds(new Set());
    setExerciseConfigs([]);
  };

  const toggleExercise = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const goToStep3 = () => {
    if (selectedIds.size === 0) {
      Alert.alert(t('common.attention', 'Atenção'), t('personal.studentDetail.selectAtLeastOneExercise', 'Selecione pelo menos um exercício.'));
      return;
    }
    const selected = (allExercises || []).filter((e: any) => selectedIds.has(e.id));
    const configs: ExerciseConfig[] = selected.map((e: any) => {
      const existing = exerciseConfigs.find((c) => c.exerciseId === e.id);
      if (existing) {
        return existing;
      }
      return {
        exerciseId: e.id,
        name: e.name,
        sets: '3',
        reps: '12',
        load: '',
        restSeconds: '60',
        expanded: false,
      };
    });
    setExerciseConfigs(configs);
    setStep(3);
  };

  const updateConfig = (id: string, field: keyof ExerciseConfig, val: string | boolean) => {
    setExerciseConfigs((prev) =>
      prev.map((cfg) => (cfg.exerciseId === id ? { ...cfg, [field]: val } : cfg))
    );
  };

  const importTemplate = async (tpl: any) => {
    try {
      const { data: tplExercises, error } = await supabase
        .from('template_exercises')
        .select('*')
        .eq('template_id', tpl.id);
      if (error) throw error;

      setFichaName(tpl.name);
      setFichaDivision(tpl.division);

      const ids = new Set<string>((tplExercises || []).map((te: any) => te.exercise_id));
      setSelectedIds(ids);

      const configs: ExerciseConfig[] = (tplExercises || []).map((te: any) => {
        const ex = (allExercises || []).find((e: any) => e.id === te.exercise_id);
        return {
          exerciseId: te.exercise_id,
          name: ex?.name || 'Exercício',
          sets: String(te.sets ?? 3),
          reps: te.reps ?? '12',
          load: te.load != null ? String(te.load) : '',
          restSeconds: String(te.rest_seconds ?? 60),
          expanded: false,
        };
      });

      setExerciseConfigs(configs);
      setTemplateModalVisible(false);
      setStep(3);
      setFichaModalVisible(true);
    } catch (e: any) {
      Alert.alert(t('personal.studentDetail.errorImporting', 'Erro ao importar'), e.message);
    }
  };

  const groupByCategory = (exercises: any[]) => {
    return exercises.reduce((acc: Record<string, any[]>, ex) => {
      const cat = ex.category || 'Outros';
      acc[cat] = acc[cat] || [];
      acc[cat].push(ex);
      return acc;
    }, {});
  };

  const groupedExercises = useMemo(() => groupByCategory(allExercises || []), [allExercises]);

  // Tab views
  const renderCurrentWorkouts = () => {
    return (
      <View style={styles.tabScroll}>
        <Card padding={14} style={[styles.vigenteCard, { backgroundColor: theme.primarySoft, borderColor: `${theme.primaryColor}33` }]}>
          <View style={styles.vigenteHeader}>
            <View style={styles.vigenteTextContainer}>
              <Typography variant="mono" colorType="primary" style={styles.vigenteLabel}>{t('personal.studentDetail.currentPlan', 'PLANO VIGENTE')}</Typography>
              <Typography variant="bold" style={styles.vigenteTitle}>{student?.plan || 'Push/Pull/Legs · Hipertrofia'}</Typography>
              <Typography variant="caption" colorType="textDim" style={styles.vigenteMeta}>{t('personal.studentDetail.currentPlanMeta', 'Semana 5 de 8 · expira em 18 dias')}</Typography>
            </View>
            <Button variant="soft" size="sm" style={styles.vigenteButton} title={t('common.edit', 'Editar')} />
          </View>
        </Card>

        <View style={styles.sectionTitleRow}>
          <Typography variant="mono" colorType="textMuted" style={styles.sectionLabel}>{t('personal.studentDetail.divisions', 'DIVISÕES')}</Typography>
          <View style={styles.btnRow}>
            <Button size="sm" variant="primary" title={t('personal.studentDetail.newWorkoutBtn', 'Nova Ficha')} onPress={() => setFichaModalVisible(true)} />
            <Button size="sm" variant="secondary" title={t('personal.studentDetail.importBtnShort', 'Importar')} onPress={() => setTemplateModalVisible(true)} />
          </View>
        </View>

        {workoutsLoading ? (
          <Typography variant="body" colorType="textDim" style={styles.centerText}>{t('personal.studentDetail.loadingWorkouts', 'Carregando fichas...')}</Typography>
        ) : workouts && workouts.length > 0 ? (
          workouts.map((w: any) => {
            const count = exerciseCounts?.[w.id] ?? 0;
            return (
              <Card key={w.id} padding={14} style={styles.divisionCard}>
                <View style={styles.divisionRow}>
                  <View style={[styles.divisionLetterBg, { backgroundColor: theme.primaryColor }]}>
                    <Typography variant="bold" style={styles.divisionLetter}>{w.division}</Typography>
                  </View>
                  <View style={styles.divisionInfo}>
                    <View style={styles.divisionNameRow}>
                      <Typography variant="bold" style={styles.divisionName}>{w.name}</Typography>
                    </View>
                    <View style={styles.divisionSubMeta}>
                      <Typography variant="caption" colorType="textDim">{t('personal.workouts.workoutExercisesCount', { count: count })}</Typography>
                      <Typography variant="caption" colorType="textMuted">·</Typography>
                      <Typography variant="caption" colorType="textDim">{w.estimated_time || 50} {t('personal.studentDetail.min', 'min')}</Typography>
                    </View>
                  </View>
                  <View style={styles.divisionWeekProgress}>
                    <Typography variant="mono" style={styles.divisionProgressVal}>4/4</Typography>
                    <Typography variant="mono" colorType="textMuted" style={styles.divisionProgressLabel}>{t('personal.studentDetail.week', 'SEMANA')}</Typography>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <FileText size={36} color={theme.textMuted} />
            <Typography variant="body" colorType="textDim" style={styles.emptyText}>{t('personal.studentDetail.noWorkouts', 'Nenhuma ficha cadastrada para este aluno.')}</Typography>
          </View>
        )}
      </View>
    );
  };

  const renderPastWorkouts = () => {
    const historyList = [
      { name: t('personal.studentDetail.fullBodyBeginner', 'Full Body Iniciante'), period: '12 jan — 09 mar 2026', weeks: 8, adherence: 89 },
      { name: t('personal.studentDetail.upperLower4x', 'Upper/Lower 4x'), period: '14 nov — 09 jan 2026', weeks: 8, adherence: 72 },
    ];
    return (
      <View style={styles.tabScroll}>
        <Typography variant="mono" colorType="textMuted" style={styles.historySectionTitle}>{t('personal.studentDetail.workoutHistory', 'HISTÓRICO DE FICHAS')}</Typography>
        {historyList.map((h, i) => (
          <Card key={i} padding={14} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View>
                <Typography variant="bold" style={styles.historyName}>{h.name}</Typography>
                <Typography variant="mono" colorType="textDim" style={styles.historyPeriod}>{h.period}</Typography>
              </View>
              <ChevronRight size={16} color={theme.textMuted} />
            </View>
            <View style={styles.historyDivider} />
            <View style={styles.historyStatsRow}>
              <View>
                <Typography variant="mono" colorType="textMuted" style={styles.historyStatLabel}>{t('personal.studentDetail.duration', 'DURAÇÃO')}</Typography>
                <Typography variant="mono" style={styles.historyStatVal}>{h.weeks} {t('personal.studentDetail.weeksShort', 'sem.')}</Typography>
              </View>
              <View>
                <Typography variant="mono" colorType="textMuted" style={styles.historyStatLabel}>{t('personal.studentDetail.adherence', 'ADESÃO')}</Typography>
                <Typography variant="mono" style={{ color: h.adherence >= 85 ? theme.success : theme.warn, fontWeight: '600' }}>{h.adherence}%</Typography>
              </View>
            </View>
          </Card>
        ))}
      </View>
    );
  };

  const renderEvolution = () => {
    const latestMeasure = measurements?.[0];
    
    // Fallback values if no measurements are recorded yet
    const currentWeight = latestMeasure ? latestMeasure.weight : 64.8;
    const currentFat = latestMeasure ? latestMeasure.fat_percent : 22.1;
    
    // Prepare weight history array for chart
    const weightHistory = measurements && measurements.length > 0
      ? [...measurements].reverse().map(m => m.weight).slice(-5)
      : [67.1, 66.5, 65.9, 65.2, 64.8];
      
    const maxWeight = Math.max(...weightHistory);
    const minWeight = Math.min(...weightHistory);

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.tabScroll}>
        {/* Métricas Principais */}
        <View style={styles.metricsGrid}>
          <Card padding={14} style={styles.metricCard}>
            <Typography variant="caption" colorType="textDim" style={styles.metricLabel}>{t('personal.studentDetail.currentWeight', 'Peso atual')}</Typography>
            <View style={styles.metricValueRow}>
              <Typography variant="mono" style={styles.metricValue}>{String(currentWeight).replace('.', ',')}</Typography>
              <Typography variant="caption" colorType="textDim" style={styles.metricUnit}>kg</Typography>
            </View>
          </Card>
          <Card padding={14} style={styles.metricCard}>
            <Typography variant="caption" colorType="textDim" style={styles.metricLabel}>{t('personal.studentDetail.fatPercent', '% Gordura')}</Typography>
            <View style={styles.metricValueRow}>
              <Typography variant="mono" style={styles.metricValue}>{String(currentFat).replace('.', ',')}</Typography>
              <Typography variant="caption" colorType="textDim" style={styles.metricUnit}>%</Typography>
            </View>
          </Card>
        </View>

        {/* Gráfico de Peso */}
        <Card padding={16} style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Typography variant="bold" style={styles.chartTitle}>{t('personal.studentDetail.weightCurve', 'Curva de peso (kg)')}</Typography>
          </View>
          <View style={styles.customBarChart}>
            {weightHistory.map((val, idx) => {
              const heightPct = maxWeight === minWeight ? 100 : ((val - minWeight + 1) / (maxWeight - minWeight + 1)) * 100;
              return (
                <View key={idx} style={styles.chartBarWrapper}>
                  <View style={[styles.chartBar, { height: `${heightPct}%`, backgroundColor: theme.primaryColor }]} />
                  <Typography variant="mono" style={styles.chartBarLabel}>{val}</Typography>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Últimas Medidas Completas */}
        {latestMeasure && (
          <Card padding={16} style={{ marginBottom: 16 }}>
            <Typography variant="bold" style={{ fontSize: 15, marginBottom: 12 }}>{t('personal.studentDetail.latestMeasurements', 'Últimas Medidas Físicas (cm)')}</Typography>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ width: '45%' }}>
                <Typography variant="caption" colorType="textMuted">{t('personal.studentDetail.chest', 'Peitoral:')}</Typography>
                <Typography variant="bold">{latestMeasure.chest || '-'} cm</Typography>
              </View>
              <View style={{ width: '45%' }}>
                <Typography variant="caption" colorType="textMuted">{t('personal.studentDetail.waist', 'Cintura:')}</Typography>
                <Typography variant="bold">{latestMeasure.waist || '-'} cm</Typography>
              </View>
              <View style={{ width: '45%' }}>
                <Typography variant="caption" colorType="textMuted">{t('personal.studentDetail.arm', 'Braço (E / D):')}</Typography>
                <Typography variant="bold">{latestMeasure.biceps_left || '-'} / {latestMeasure.biceps_right || '-'} cm</Typography>
              </View>
              <View style={{ width: '45%' }}>
                <Typography variant="caption" colorType="textMuted">{t('personal.studentDetail.forearm', 'Antebraço (E / D):')}</Typography>
                <Typography variant="bold">{latestMeasure.forearm_left || '-'} / {latestMeasure.forearm_right || '-'} cm</Typography>
              </View>
              <View style={{ width: '45%' }}>
                <Typography variant="caption" colorType="textMuted">{t('personal.studentDetail.thigh', 'Coxa (E / D):')}</Typography>
                <Typography variant="bold">{latestMeasure.thigh_left || '-'} / {latestMeasure.thigh_right || '-'} cm</Typography>
              </View>
              <View style={{ width: '45%' }}>
                <Typography variant="caption" colorType="textMuted">{t('personal.studentDetail.calf', 'Panturrilha (E / D):')}</Typography>
                <Typography variant="bold">{latestMeasure.calf_left || '-'} / {latestMeasure.calf_right || '-'} cm</Typography>
              </View>
            </View>
          </Card>
        )}

        {/* Histórico Completo de Medidas */}
        {measurements && measurements.length > 0 && (
          <Card padding={16} style={{ marginBottom: 16 }}>
            <Typography variant="bold" style={{ fontSize: 15, marginBottom: 8 }}>{t('personal.studentDetail.measurementsHistory', 'Histórico de Medições')}</Typography>
            {measurements.map((m: any) => (
              <View key={m.id} style={{ borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 8 }}>
                <Typography variant="bold" style={{ fontSize: 13, marginBottom: 4 }}>
                  {new Date(m.created_at).toLocaleDateString(i18n.language || 'pt-BR')} - {m.weight} kg (BF: {m.fat_percent}%)
                </Typography>
                <Typography variant="caption" colorType="textDim">
                  {t('personal.studentDetail.armsShort', 'Braços:')} {m.biceps_left}/{m.biceps_right}cm · {t('personal.studentDetail.waistShort', 'Cintura:')} {m.waist}cm · {t('personal.studentDetail.legsShort', 'Pernas:')} {m.thigh_left}/{m.thigh_right}cm
                </Typography>
              </View>
            ))}
          </Card>
        )}

        {/* Fotos de progresso */}
        <View style={styles.photosSectionHeader}>
          <Typography variant="mono" colorType="textMuted" style={styles.photosSectionTitle}>{t('personal.studentDetail.progressPhotos', 'FOTOS DE PROGRESSO')}</Typography>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
          {progressItems?.filter((pi: any) => pi.photo_url).map((pi: any, idx) => (
            <View key={idx} style={styles.photoContainer}>
              <View style={[styles.photoBox, { borderColor: theme.borderStrong, backgroundColor: theme.surfaceHi }]}>
                {pi.photo_url ? (
                  <Image source={{ uri: pi.photo_url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                ) : (
                  <Typography variant="mono" colorType="textMuted">{t('personal.studentDetail.noPhoto', 'sem foto')}</Typography>
                )}
                <Typography variant="mono" style={styles.photoBoxLabel}>
                  {new Date(pi.created_at).toLocaleDateString(i18n.language || 'pt-BR', { day: '2-digit', month: 'short' })}
                </Typography>
              </View>
              <Typography variant="mono" colorType="textDim" style={styles.photoMeta}>
                {pi.load ? `${pi.load}kg` : t('personal.studentDetail.registered', 'Registrado')}
              </Typography>
            </View>
          ))}
          {(!progressItems || progressItems.filter((pi: any) => pi.photo_url).length === 0) && (
            <Typography variant="body" colorType="textDim" style={{ fontStyle: 'italic', marginVertical: 10 }}>{t('personal.studentDetail.noPhotosFromStudent', 'Nenhuma foto registrada pelo aluno.')}</Typography>
          )}
        </ScrollView>
      </ScrollView>
    );
  };

  const renderComments = () => {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => {
            const isPersonal = item.author_role === 'personal';
            const initials = getInitials(item.author_name);
            return (
              <View style={[styles.messageBubbleRow, isPersonal ? styles.rowRight : styles.rowLeft]}>
                <View style={[styles.messageAvatar, { backgroundColor: isPersonal ? theme.primaryColor : theme.surfaceHi }]}>
                  <Typography variant="bold" style={styles.messageAvatarText}>{initials}</Typography>
                </View>
                <View style={[styles.messageBox, isPersonal ? { backgroundColor: theme.surface, borderColor: theme.border } : { backgroundColor: theme.primarySoft }]}>
                  <View style={styles.messageMetaRow}>
                    <Typography variant="bold" style={[styles.messageAuthor, { color: isPersonal ? theme.text : theme.primaryColor }]}>{item.author_name}</Typography>
                    <Typography variant="mono" colorType="textMuted" style={styles.messageTime}>
                      {new Date(item.created_at).toLocaleDateString(i18n.language || 'pt-BR', { day: 'numeric', month: 'short' })}
                    </Typography>
                  </View>
                  <Typography variant="body" style={styles.messageText}>{item.message}</Typography>
                </View>
              </View>
            );
          }}
        />

        {/* Composer */}
        <View style={[styles.chatComposer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            placeholder={t('personal.studentDetail.commentPlaceholderName', 'Comentar para {{name}}...', { name: studentName?.split(' ')[0] || 'Aluno' })}
            placeholderTextColor={theme.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            style={[styles.composerInput, { color: theme.text }]}
            multiline
            keyboardAppearance="dark"
          />
          <TouchableOpacity 
            style={[styles.composerSendBtn, { backgroundColor: theme.primaryColor }]}
            onPress={() => sendCommentMutation.mutate()}
            disabled={!commentText.trim()}
          >
            <Send size={14} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.back()}>
          <ArrowLeft size={18} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.actionBtnIcon, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setActiveSubTab('coment')}
          >
            <MessageSquare size={18} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtnIcon, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MoreHorizontal size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Aluno */}
      <View style={styles.profileSummary}>
        <View style={[styles.profileAvatar, { backgroundColor: theme.primaryDeep, borderColor: theme.primaryColor }]}>
          <Typography variant="bold" style={styles.profileAvatarText}>
            {studentName ? getInitials(studentName) : '?'}
          </Typography>
        </View>
        <View style={styles.profileMeta}>
          <Typography variant="h1" style={styles.profileName}>{studentName}</Typography>
          <Typography variant="caption" colorType="textDim" style={styles.profileSubtitle}>
            {student?.goal || t('personal.studentDetail.goal', 'Objetivo')} · {t('personal.studentDetail.months', '{{count}} meses', { count: 8 })}
          </Typography>
          <View style={styles.badgeRow}>
            <View style={[styles.badgeSuccess, { backgroundColor: 'rgba(91,211,124,0.12)' }]}>
              <View style={[styles.badgeDot, { backgroundColor: theme.success }]} />
              <Typography variant="bold" style={[styles.badgeText, { color: theme.success }]}>{t('common.active', 'Ativo')}</Typography>
            </View>
            <View style={[styles.badgePrimary, { backgroundColor: theme.primarySoft }]}>
              <Typography variant="bold" style={[styles.badgeText, { color: theme.primaryColor }]}>{t('personal.studentDetail.adherencePct', '{{pct}}% adesão', { pct: student?.adherence || 90 })}</Typography>
            </View>
          </View>
        </View>
      </View>

      {/* Documentos do Aluno (Meal plans, medical logs) */}
      {documents && documents.length > 0 && (
        <Card padding={12} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FileText size={16} color={theme.primaryColor} />
            <Typography variant="bold" style={{ fontSize: 14 }}>{t('personal.studentDetail.sharedDocuments', 'Documentos Compartilhados')}</Typography>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {documents.map((doc: any) => (
              <TouchableOpacity
                key={doc.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: theme.surfaceHi,
                  borderWidth: 1,
                  borderColor: theme.border,
                  gap: 6
                }}
                onPress={() => Alert.alert(t('personal.studentDetail.viewDocument', 'Visualizar Documento'), t('personal.studentDetail.openingDocumentName', 'Abrindo o documento "{{name}}"...', { name: doc.name }))}
              >
                <FileText size={14} color={theme.textDim} />
                <Typography variant="bold" style={{ fontSize: 11 }}>{doc.name}</Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>
      )}

      {/* Sub-tabs Controle Segmentado */}
      <View style={[styles.subTabsContainer, { backgroundColor: theme.surfaceLo, borderColor: theme.border }]}>
        {([
          { key: 'atual', label: t('personal.studentDetail.tabWorkoutsCurrent', 'Fichas atuais') },
          { key: 'antigas', label: t('personal.studentDetail.tabWorkoutsPast', 'Antigas') },
          { key: 'evolucao', label: t('personal.studentDetail.tabEvolution', 'Evolução') },
          { key: 'coment', label: t('personal.studentDetail.tabComments', 'Comentários') }
        ] as const).map((s) => {
          const isSelected = activeSubTab === s.key;
          return (
            <TouchableOpacity 
              key={s.key} 
              onPress={() => setActiveSubTab(s.key)}
              style={[styles.subTabPill, isSelected && { backgroundColor: theme.surfaceHi }]}
            >
              <Typography 
                variant="bold" 
                style={[
                  styles.subTabLabel, 
                  { color: isSelected ? theme.text : theme.textMuted }
                ]}
              >
                {s.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Conteúdo Aba Ativa */}
      <View style={styles.content}>
        {activeSubTab === 'atual' && renderCurrentWorkouts()}
        {activeSubTab === 'antigas' && renderPastWorkouts()}
        {activeSubTab === 'evolucao' && renderEvolution()}
        {activeSubTab === 'coment' && renderComments()}
      </View>

      {/* Modal Ficha Template Import */}
      <Modal visible={templateModalVisible} onClose={() => setTemplateModalVisible(false)} title={t('personal.studentDetail.importModalTitle', 'Importar Ficha Modelo')}>
        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 12 }}>{t('personal.studentDetail.importSelectTemplate', 'Selecione uma ficha de modelo de treino do seu banco:')}</Typography>
        <ScrollView style={{ maxHeight: 300 }}>
          {templates?.map((t: any) => (
            <TouchableOpacity 
              key={t.id}
              style={[styles.templateItemCard, { backgroundColor: theme.surfaceLo, borderColor: theme.border }]}
              onPress={() => importTemplate(t)}
            >
              <FileText size={18} color={theme.primaryColor} />
              <View style={{ flex: 1 }}>
                <Typography variant="bold" style={{ fontSize: 14 }}>{t.name}</Typography>
                <Typography variant="caption" colorType="textDim">{t('personal.studentDetail.workoutDivisionLabel', 'Treino {{division}}', { division: t.division })}</Typography>
              </View>
              <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
          {(!templates || templates.length === 0) && (
            <Typography variant="body" colorType="textDim" style={styles.centerText}>{t('personal.studentDetail.noTemplates', 'Nenhum template cadastrado.')}</Typography>
          )}
        </ScrollView>
      </Modal>

      {/* Modal Criar Ficha Novo Treino */}
      <Modal visible={fichaModalVisible} onClose={resetFichaModal} title={step === 1 ? t('personal.studentDetail.newWorkoutBtn', 'Nova Ficha') : step === 2 ? t('personal.workouts.btnSelectExercises', 'Selecionar Exercícios') : t('personal.workouts.btnConfigureExercises', 'Configurar Exercícios')}>
        {step === 1 && (
          <View>
            <Input label={t('personal.studentDetail.workoutNameLabel', 'Nome da Ficha de Treino')} placeholder={t('personal.studentDetail.workoutNamePlaceholder', 'Ex: Treino de Pernas e Glúteo')} value={fichaName} onChangeText={setFichaName} />
            <Input label={t('personal.workouts.divisionLabel', 'Divisão (Treino A, B, C...)')} placeholder={t('personal.workouts.divisionPlaceholder', 'Ex: A')} value={fichaDivision} onChangeText={setFichaDivision} maxLength={2} autoCapitalize="characters" />
            <Button style={styles.modalStepBtn} title={t('personal.workouts.btnSelectExercises', 'Selecionar Exercícios')} onPress={() => {
              if (!fichaName.trim()) {
                Alert.alert(t('common.error', 'Erro'), t('personal.studentDetail.workoutNameRequired', 'Nome do treino é obrigatório.'));
                return;
              }
              setStep(2);
            }} />
          </View>
        )}

        {step === 2 && (
          <View>
            <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled>
              {Object.keys(groupedExercises).map((cat) => (
                <View key={cat} style={{ marginBottom: 14 }}>
                  <Typography variant="bold" colorType="primary" style={styles.categoryHeader}>{cat}</Typography>
                  {groupedExercises[cat].map((ex) => {
                    const isSelected = selectedIds.has(ex.id);
                    return (
                      <TouchableOpacity 
                        key={ex.id}
                        onPress={() => toggleExercise(ex.id)}
                        style={[styles.selectExerciseRow, { backgroundColor: isSelected ? theme.primarySoft : theme.surfaceLo, borderColor: isSelected ? theme.primaryColor : theme.border }]}
                      >
                        <View style={[styles.selectCheckbox, { backgroundColor: isSelected ? theme.primaryColor : 'transparent', borderColor: isSelected ? 'transparent' : theme.textMuted }]}>
                          {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <Typography variant="bold" style={{ fontSize: 13.5 }}>{ex.name}</Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalStepActionsRow}>
              <Button 
                title={t('common.back', 'Voltar')} 
                variant="secondary"
                onPress={() => setStep(1)} 
                style={styles.modalStepActionBtn} 
              />
              <Button 
                title={t('personal.studentDetail.configureCount', 'Configurar ({{count}})', { count: selectedIds.size })} 
                onPress={goToStep3} 
                style={[styles.modalStepActionBtn, { flex: 2, marginLeft: 8 }]} 
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled>
              {exerciseConfigs.map((cfg) => (
                <Card key={cfg.exerciseId} padding={12} style={styles.modalConfigCard}>
                  <TouchableOpacity 
                    style={styles.modalConfigHeader}
                    onPress={() => updateConfig(cfg.exerciseId, 'expanded', !cfg.expanded)}
                  >
                    <Typography variant="bold" style={{ flex: 1 }}>{cfg.name}</Typography>
                    {cfg.expanded ? <ChevronUp size={16} color={theme.text} /> : <ChevronDown size={16} color={theme.text} />}
                  </TouchableOpacity>
                  {cfg.expanded && (
                    <View style={styles.modalConfigBody}>
                      <View style={styles.modalConfigRow}>
                        <View style={{ flex: 1 }}><Input label={t('personal.workouts.setsLabel', 'Séries')} value={cfg.sets} onChangeText={(v) => updateConfig(cfg.exerciseId, 'sets', v)} keyboardType="numeric" /></View>
                        <View style={{ flex: 1, marginLeft: 8 }}><Input label={t('personal.workouts.repsLabel', 'Repetições')} value={cfg.reps} onChangeText={(v) => updateConfig(cfg.exerciseId, 'reps', v)} /></View>
                        <View style={{ flex: 1, marginLeft: 8 }}><Input label={t('personal.workouts.restLabel', 'Descanso (s)')} value={cfg.restSeconds} onChangeText={(v) => updateConfig(cfg.exerciseId, 'restSeconds', v)} keyboardType="numeric" /></View>
                        <View style={{ flex: 1, marginLeft: 8 }}><Input label={t('personal.workouts.loadLabel', 'Carga (kg)')} value={cfg.load} onChangeText={(v) => updateConfig(cfg.exerciseId, 'load', v)} keyboardType="numeric" /></View>
                      </View>
                    </View>
                  )}
                </Card>
              ))}
            </ScrollView>
            <View style={styles.modalStepActionsRow}>
              <Button 
                title={t('common.back', 'Voltar')} 
                variant="secondary"
                onPress={() => setStep(2)} 
                style={styles.modalStepActionBtn} 
              />
              <Button 
                title={t('personal.studentDetail.saveWorkout', 'Salvar Ficha')} 
                loading={createFichaMutation.isPending} 
                onPress={() => createFichaMutation.mutate()} 
                style={[styles.modalStepActionBtn, { flex: 2, marginLeft: 8 }]} 
              />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 13,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgePrimary: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
  },
  subTabsContainer: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  subTabPill: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabLabel: {
    fontSize: 11.5,
    letterSpacing: -0.1,
  },
  content: {
    flex: 1,
  },
  tabScroll: {
    flex: 1,
  },
  vigenteCard: {
    marginVertical: 0,
    marginBottom: 14,
    borderWidth: 1,
  },
  vigenteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vigenteTextContainer: {
    flex: 1,
  },
  vigenteLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  vigenteTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  vigenteMeta: {
    fontSize: 12,
  },
  vigenteButton: {
    marginVertical: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  divisionCard: {
    marginVertical: 4,
  },
  divisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divisionLetterBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divisionLetter: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  divisionInfo: {
    flex: 1,
  },
  divisionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  divisionName: {
    fontSize: 14.5,
  },
  divisionSubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divisionWeekProgress: {
    alignItems: 'flex-end',
  },
  divisionProgressVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  divisionProgressLabel: {
    fontSize: 8.5,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 10,
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
    marginTop: 30,
  },
  historySectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  historyCard: {
    marginVertical: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyName: {
    fontSize: 14.5,
    marginBottom: 4,
  },
  historyPeriod: {
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
  historyDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 10,
  },
  historyStatsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  historyStatLabel: {
    fontSize: 9.5,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  historyStatVal: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    marginVertical: 0,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '600',
  },
  metricUnit: {
    fontSize: 11.5,
  },
  metricTrend: {
    fontSize: 10.5,
    marginTop: 4,
  },
  chartCard: {
    marginVertical: 0,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
  },
  chartPeriods: {
    flexDirection: 'row',
    gap: 4,
  },
  chartPeriodPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  customBarChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    paddingTop: 10,
  },
  chartBarWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  chartBar: {
    width: 14,
    borderRadius: 3,
    minHeight: 10,
  },
  chartBarLabel: {
    fontSize: 9,
    color: '#9097A4',
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  photosSectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  photosScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  photoContainer: {
    width: 96,
  },
  photoBox: {
    height: 130,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBoxLabel: {
    fontSize: 11,
    color: '#9097A4',
  },
  photoMeta: {
    fontSize: 10.5,
    marginTop: 6,
    textAlign: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  chatList: {
    paddingBottom: 20,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
    maxWidth: '85%',
  },
  rowLeft: {
    alignSelf: 'flex-start',
  },
  rowRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  messageBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  messageAuthor: {
    fontSize: 12,
  },
  messageTime: {
    fontSize: 9.5,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  composerInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    minHeight: 28,
    maxHeight: 60,
  },
  composerSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  categoryHeader: {
    fontSize: 12.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  selectExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 3,
  },
  selectCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStepBtn: {
    marginTop: 14,
  },
  modalConfigCard: {
    marginVertical: 4,
  },
  modalConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalConfigBody: {
    marginTop: 10,
  },
  modalConfigRow: {
    flexDirection: 'row',
    width: '100%',
  },
  modalStepActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  modalStepActionBtn: {
    flex: 1,
    marginVertical: 0,
  },
});
