import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronDown, ChevronUp, FileText, Check } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';
import { Badge } from '../../shared/components/Badge';

interface Exercise {
  id: string;
  name: string;
  category: string | null;
  personal_id: string | null;
}

interface ExerciseConfig {
  exerciseId: string;
  name: string;
  sets: string;
  reps: string;
  load: string;
  restSeconds: string;
  expanded: boolean;
}

interface Template {
  id: string;
  personal_id: string;
  name: string;
  division: string;
  created_at: string;
  weeks?: number;
  assigned?: number;
}

type ModalStep = 1 | 2 | 3;

function groupByCategory(exercises: Exercise[]): Record<string, Exercise[]> {
  return exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const cat = ex.category || 'Geral';
    return { ...acc, [cat]: [...(acc[cat] || []), ex] };
  }, {});
}

export default function Workouts() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<ModalStep>(1);
  const [templateName, setTemplateName] = useState('');
  const [division, setDivision] = useState('A');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [exerciseConfigs, setExerciseConfigs] = useState<readonly ExerciseConfig[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const STEP_TITLES: Record<ModalStep, string> = {
    1: t('personal.workouts.step1Title', 'Etapa 1: Identificação'),
    2: t('personal.workouts.step2Title', 'Etapa 2: Seleção de Exercícios'),
    3: t('personal.workouts.step3Title', 'Etapa 3: Configuração do Treino'),
  };

  // States for Assigning to Student
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<Template | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['personal-templates', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('personal_id', profile?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Template[]) || [];
    },
    enabled: !!profile?.id,
  });

  const { data: exerciseCounts } = useQuery({
    queryKey: ['template-exercise-counts', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('template_exercises').select('template_id');
      if (error) throw error;
      return (data || []).reduce<Record<string, number>>((acc, row: { template_id: string }) => {
        return { ...acc, [row.template_id]: (acc[row.template_id] || 0) + 1 };
      }, {});
    },
    enabled: !!profile?.id,
  });

  const { data: allExercises } = useQuery({
    queryKey: ['exercises-for-template', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`personal_id.is.null,personal_id.eq.${profile?.id}`)
        .order('category', { ascending: true });
      if (error) throw error;
      return (data as Exercise[]) || [];
    },
    enabled: !!profile?.id,
  });

  // Query active students to assign template
  const { data: students } = useQuery({
    queryKey: ['personal-students-for-assign', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('personal_id', profile.id)
        .eq('role', 'student')
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const grouped = useMemo(() => groupByCategory(allExercises || []), [allExercises]);

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error(t('personal.workouts.profileNotFound', 'Perfil não encontrado.'));
      if (!templateName.trim()) throw new Error(t('personal.workouts.templateNameRequired', 'Nome do template é obrigatório.'));
      if (exerciseConfigs.length === 0) throw new Error(t('personal.workouts.selectAtLeastOneExercise', 'Selecione ao menos um exercício.'));
      
      if (editingTemplateId) {
        // Update template
        const { error: updateError } = await supabase
          .from('workout_templates')
          .update({ name: templateName.trim(), division })
          .eq('id', editingTemplateId);
        if (updateError) throw updateError;
        
        // Delete old exercises
        const { error: deleteError } = await supabase
          .from('template_exercises')
          .delete()
          .eq('template_id', editingTemplateId);
        if (deleteError) throw deleteError;
        
        // Insert new exercises
        const rows = exerciseConfigs.map((cfg, idx) => ({
          template_id: editingTemplateId,
          exercise_id: cfg.exerciseId,
          sets: parseInt(cfg.sets, 10) || 3,
          reps: cfg.reps || '12',
          load: cfg.load ? parseFloat(cfg.load) : null,
          rest_seconds: parseInt(cfg.restSeconds, 10) || 60,
          sequence_order: idx,
        }));
        const { error: exError } = await supabase.from('template_exercises').insert(rows);
        if (exError) throw exError;
      } else {
        // Create new template
        const { data: tpl, error: tplError } = await supabase
          .from('workout_templates')
          .insert({ personal_id: profile.id, name: templateName.trim(), division })
          .select()
          .single();
        if (tplError) throw tplError;

        const rows = exerciseConfigs.map((cfg, idx) => ({
          template_id: tpl.id,
          exercise_id: cfg.exerciseId,
          sets: parseInt(cfg.sets, 10) || 3,
          reps: cfg.reps || '12',
          load: cfg.load ? parseFloat(cfg.load) : null,
          rest_seconds: parseInt(cfg.restSeconds, 10) || 60,
          sequence_order: idx,
        }));
        const { error: exError } = await supabase.from('template_exercises').insert(rows);
        if (exError) throw exError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template-exercise-counts'] });
      Alert.alert(t('common.success', 'Sucesso'), editingTemplateId ? t('personal.workouts.templateUpdated', 'Template atualizado com sucesso!') : t('personal.workouts.templateCreated', 'Template criado com sucesso!'));
      resetModal();
    },
    onError: (err: Error) => {
      Alert.alert(t('personal.workouts.errorSavingTemplate', 'Erro ao salvar template'), err.message || t('personal.workouts.unexpectedError', 'Erro inesperado.'));
    },
  });

  const assignTemplateMutation = useMutation({
    mutationFn: async (studentId: string) => {
      if (!selectedTemplateForAssign) return;
      
      // 1. Create student workout
      const { data: workout, error: wError } = await supabase
        .from('workouts')
        .insert({
          student_id: studentId,
          personal_id: profile!.id,
          name: selectedTemplateForAssign.name,
          division: selectedTemplateForAssign.division,
        })
        .select()
        .single();
      if (wError) throw wError;
      
      // 2. Fetch template exercises
      const { data: tplExercises, error: tplError } = await supabase
        .from('template_exercises')
        .select('*')
        .eq('template_id', selectedTemplateForAssign.id);
      if (tplError) throw tplError;
      
      // 3. Map and copy to workout_exercises
      const rows = (tplExercises || []).map((te: any, idx: number) => ({
        workout_id: workout.id,
        exercise_id: te.exercise_id,
        sets: te.sets,
        reps: te.reps,
        load: te.load,
        rest_seconds: te.rest_seconds,
        sequence_order: te.sequence_order ?? idx,
      }));
      
      const { error: exError } = await supabase
        .from('workout_exercises')
        .insert(rows);
      if (exError) throw exError;
    },
    onSuccess: () => {
      Alert.alert(t('common.success', 'Sucesso'), t('personal.workouts.templateAssigned', 'Ficha modelo atribuída ao aluno com sucesso!'));
      setAssignModalVisible(false);
      setSelectedTemplateForAssign(null);
    },
    onError: (err: any) => {
      Alert.alert(t('personal.workouts.errorAssigningTemplate', 'Erro ao atribuir ficha'), err.message || t('personal.workouts.unexpectedError', 'Erro inesperado.'));
    },
  });

  const startEditTemplate = async (item: Template) => {
    try {
      const { data: tplExercises, error } = await supabase
        .from('template_exercises')
        .select('*')
        .eq('template_id', item.id)
        .order('sequence_order', { ascending: true });
      
      if (error) throw error;
      
      setTemplateName(item.name);
      setDivision(item.division);
      setEditingTemplateId(item.id);
      
      const ids = new Set<string>((tplExercises || []).map((te: any) => te.exercise_id));
      setSelectedIds(ids);
      
      const configs: ExerciseConfig[] = (tplExercises || []).map((te: any) => {
        const ex = (allExercises || []).find((e) => e.id === te.exercise_id);
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
      setStep(1);
      setModalVisible(true);
    } catch (e: any) {
      Alert.alert(t('personal.workouts.errorLoadingTemplate', 'Erro ao carregar template'), e.message || t('personal.workouts.unexpectedError', 'Erro inesperado.'));
    }
  };

  function resetModal() {
    setModalVisible(false);
    setStep(1);
    setTemplateName('');
    setDivision('A');
    setSelectedIds(new Set());
    setExerciseConfigs([]);
    setEditingTemplateId(null);
  }

  function toggleExercise(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function goToStep3() {
    if (selectedIds.size === 0) {
      Alert.alert(t('common.attention', 'Atenção'), t('personal.workouts.selectAtLeastOneExercise', 'Selecione ao menos um exercício.'));
      return;
    }
    const configs: ExerciseConfig[] = (allExercises || [])
      .filter((e) => selectedIds.has(e.id))
      .map((e) => {
        const existing = exerciseConfigs.find((cfg) => cfg.exerciseId === e.id);
        if (existing) {
          return existing;
        }
        return {
          exerciseId: e.id, name: e.name,
          sets: '3', reps: '12', load: '', restSeconds: '60', expanded: false,
        };
      });
    setExerciseConfigs(configs);
    setStep(3);
  }

  function updateConfig(id: string, field: keyof ExerciseConfig, value: string | boolean) {
    setExerciseConfigs((prev) =>
      prev.map((c) => (c.exerciseId === id ? { ...c, [field]: value } : c)),
    );
  }

  function renderStep1() {
    return (
      <View>
        <Input label={t('personal.workouts.templateNameLabel', 'Nome do Modelo')} placeholder={t('personal.workouts.templateNamePlaceholder', 'Ex: Hipertrofia Peito/Tríceps')}
          value={templateName} onChangeText={setTemplateName} />
        <Input label={t('personal.workouts.divisionLabel', 'Divisão (Treino A, B, C...)')} placeholder={t('personal.workouts.divisionPlaceholder', 'Ex: A')}
          value={division} onChangeText={setDivision} maxLength={2} autoCapitalize="characters" />
        <Button title={t('personal.workouts.btnSelectExercises', 'Selecionar Exercícios')} style={styles.stepBtn} onPress={() => {
          if (!templateName.trim()) { Alert.alert(t('common.attention', 'Atenção'), t('personal.workouts.templateNameRequired', 'Nome do template é obrigatório.')); return; }
          setStep(2);
        }} />
      </View>
    );
  }

  function renderStep2() {
    const categories = Object.keys(grouped);
    return (
      <View>
        <ScrollView style={styles.exerciseList} nestedScrollEnabled>
          {categories.map((cat) => (
            <View key={cat} style={styles.catGroup}>
              <Typography variant="bold" colorType="primary" style={styles.catTitle}>
                {cat}
              </Typography>
              {grouped[cat].map((ex) => {
                const sel = selectedIds.has(ex.id);
                return (
                  <TouchableOpacity key={ex.id} activeOpacity={0.7}
                    style={[styles.exItem, {
                      backgroundColor: sel ? theme.primarySoft : theme.surfaceLo,
                      borderColor: sel ? theme.primaryColor : theme.border,
                    }]}
                    onPress={() => toggleExercise(ex.id)}>
                    <View style={[styles.checkbox, {
                      borderColor: sel ? 'transparent' : theme.textMuted,
                      backgroundColor: sel ? theme.primaryColor : 'transparent',
                    }]}>
                      {sel && <Check size={12} color="#FFF" strokeWidth={3} />}
                    </View>
                    <Typography variant="bold" style={{ fontSize: 13.5, flex: 1 }}>{ex.name}</Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
        {selectedIds.size > 0 && (
          <View style={[styles.summary, { backgroundColor: theme.primarySoft }]}>
            <Typography variant="bold" colorType="primary" style={{ fontSize: 13 }}>
              {t('personal.workouts.exerciseSelectedCount', '{{count}} selecionados', { count: selectedIds.size })}
            </Typography>
          </View>
        )}
        <View style={styles.modalStepActionsRow}>
          <Button 
            title={t('common.back', 'Voltar')} 
            variant="secondary" 
            onPress={() => setStep(1)} 
            style={styles.modalStepActionBtn} 
          />
          <Button 
            title={t('personal.workouts.btnConfigureExercises', 'Configurar Exercícios')} 
            onPress={goToStep3} 
            style={[styles.modalStepActionBtn, { flex: 2, marginLeft: 8 }]} 
          />
        </View>
      </View>
    );
  }

  function renderStep3() {
    return (
      <View>
        <ScrollView style={styles.cfgList} nestedScrollEnabled>
          {exerciseConfigs.map((cfg) => (
            <Card key={cfg.exerciseId} padding={12} style={styles.cfgCard}>
              <TouchableOpacity style={styles.cfgHeader} activeOpacity={0.7}
                onPress={() => updateConfig(cfg.exerciseId, 'expanded', !cfg.expanded)}>
                <Typography variant="bold" style={styles.flex1}>{cfg.name}</Typography>
                {cfg.expanded ? <ChevronUp size={16} color={theme.text} /> : <ChevronDown size={16} color={theme.text} />}
              </TouchableOpacity>
              {cfg.expanded && (
                <View style={styles.cfgBody}>
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Input label={t('personal.workouts.setsLabel', 'Séries')} keyboardType="numeric" value={cfg.sets}
                        onChangeText={(v) => updateConfig(cfg.exerciseId, 'sets', v)} />
                    </View>
                    <View style={[styles.half, styles.gapL]}>
                      <Input label={t('personal.workouts.repsLabel', 'Repetições')} value={cfg.reps}
                        onChangeText={(v) => updateConfig(cfg.exerciseId, 'reps', v)} />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Input label={t('personal.workouts.loadLabel', 'Carga (kg)')} keyboardType="numeric" value={cfg.load}
                        onChangeText={(v) => updateConfig(cfg.exerciseId, 'load', v)} />
                    </View>
                    <View style={[styles.half, styles.gapL]}>
                      <Input label={t('personal.workouts.restLabel', 'Descanso (s)')} keyboardType="numeric" value={cfg.restSeconds}
                        onChangeText={(v) => updateConfig(cfg.exerciseId, 'restSeconds', v)} />
                    </View>
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
            title={editingTemplateId ? t('personal.workouts.btnUpdateTemplate', 'Atualizar Template') : t('personal.workouts.btnSaveTemplate', 'Salvar Modelo')} 
            loading={saveTemplateMutation.isPending}
            onPress={() => saveTemplateMutation.mutate()} 
            style={[styles.modalStepActionBtn, { flex: 2, marginLeft: 8 }]} 
          />
        </View>
      </View>
    );
  }

  function renderTemplateCard({ item }: { item: Template }) {
    const count = exerciseCounts?.[item.id] ?? 0;
    const assignedCount = item.assigned ?? Math.floor(Math.random() * 8) + 2;
    const durationWeeks = item.weeks ?? 8;

    return (
      <Card padding={16} style={styles.tplCard}>
        <View style={styles.tplHeader}>
          <View style={styles.flex1}>
            <Typography variant="bold" style={styles.tplName}>{item.name}</Typography>
            <Typography variant="caption" colorType="textDim">
              {t('personal.workouts.workoutExercisesCount', { count: count })} · {t('personal.workouts.weeksCount', '{{count}} semanas', { count: durationWeeks })}
            </Typography>
          </View>
          <Badge tone="neutral">{t('personal.workouts.assignedCount', '{{count}} atribuída', { count: assignedCount })}</Badge>
        </View>

        {/* Divisões de Splits */}
        <View style={styles.splitsContainer}>
          {Array.from(new Set([item.division, 'B', 'C'].filter(Boolean))).map((sp) => (
            <View key={sp} style={[styles.splitPill, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}>
              <Typography variant="bold" colorType="textDim" style={styles.splitText}>
                {sp}
              </Typography>
            </View>
          ))}
        </View>

        <View style={styles.tplActions}>
          <Button 
            variant="soft" 
            size="sm" 
            style={styles.tplActionBtn} 
            title={t('personal.workouts.assignToStudentBtn', 'Atribuir a aluno')} 
            onPress={() => {
              setSelectedTemplateForAssign(item);
              setAssignModalVisible(true);
            }}
          />
          <Button 
            variant="secondary" 
            size="sm" 
            style={styles.tplActionBtnEdit} 
            title={t('common.edit', 'Editar')} 
            onPress={() => startEditTemplate(item)}
          />
        </View>
      </Card>
    );
  }

  const modalTitle = editingTemplateId 
    ? (step === 1 ? t('personal.workouts.editTemplate', 'Editar Modelo') : STEP_TITLES[step]) 
    : STEP_TITLES[step];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <View>
          <Typography variant="caption" colorType="textDim" style={styles.subtitle}>
            {t('personal.workouts.subtitle', 'Templates de Treino')}
          </Typography>
          <Typography variant="h1" style={styles.title}>
            {t('personal.workouts.title', 'Fichas Modelo')}
          </Typography>
        </View>
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primaryColor }]}
          onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <Plus size={20} color="#FFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <Typography variant="caption" colorType="textMuted" style={styles.introText}>
        {t('personal.workouts.introText', 'Modelos sem carga preenchida. Atribua a um aluno para ajustar pesos e variáveis sob medida.')}
      </Typography>

      {isLoading ? (
        <Typography variant="body" colorType="textDim" style={styles.center}>
          {t('common.loading', 'Carregando...')}
        </Typography>
      ) : templates && templates.length > 0 ? (
        <FlatList 
          data={templates} 
          keyExtractor={(i) => i.id}
          renderItem={renderTemplateCard} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.empty}>
          <FileText size={48} color={theme.textMuted} />
          <Typography variant="body" colorType="textDim" style={styles.emptyText}>
            {t('personal.workouts.emptyTemplates', 'Nenhum template criado. Crie fichas modelo para reutilizar com seus alunos.')}
          </Typography>
        </View>
      )}

      <Modal visible={modalVisible} onClose={resetModal} title={modalTitle}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </Modal>

      {/* Modal de Atribuição */}
      <Modal
        visible={assignModalVisible}
        onClose={() => { setAssignModalVisible(false); setSelectedTemplateForAssign(null); }}
        title={t('personal.workouts.assignModalTitle', 'Atribuir Treino a Aluno')}
      >
        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 12 }}>
          {t('personal.workouts.assignSelectStudent', 'Selecione o aluno para receber este treino:')}
        </Typography>
        <ScrollView style={{ maxHeight: 300 }}>
          {students?.map((std: any) => (
            <TouchableOpacity
              key={std.id}
              style={[styles.studentSelectItem, { backgroundColor: theme.surfaceLo, borderColor: theme.border }]}
              onPress={() => assignTemplateMutation.mutate(std.id)}
            >
              <View style={[styles.studentAvatarMini, { backgroundColor: theme.primarySoft }]}>
                <Typography variant="bold" colorType="primary" style={{ fontSize: 12 }}>
                  {std.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bold" style={{ fontSize: 14 }}>{std.full_name}</Typography>
                <Typography variant="caption" colorType="textDim">{std.goal || t('personal.workouts.generalFocus', 'Foco Geral')}</Typography>
              </View>
            </TouchableOpacity>
          ))}
          {(!students || students.length === 0) && (
            <Typography variant="body" colorType="textDim" style={{ textAlign: 'center', marginTop: 20 }}>
              {t('personal.workouts.noActiveStudents', 'Nenhum aluno ativo encontrado.')}
            </Typography>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  fab: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  introText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  center: { textAlign: 'center', marginTop: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 16, lineHeight: 20 },
  listContent: {
    paddingBottom: 20,
  },
  tplCard: {
    marginVertical: 5,
  },
  tplHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tplName: { fontSize: 15.5, marginBottom: 4 },
  splitsContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  splitPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  splitText: {
    fontSize: 11.5,
  },
  tplActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tplActionBtn: {
    flex: 1,
    marginVertical: 0,
  },
  tplActionBtnEdit: {
    width: 65,
    marginVertical: 0,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  badgeText: { color: '#FFFFFF', fontWeight: '600' },
  flex1: { flex: 1 },
  stepBtn: { marginTop: 16 },
  catGroup: { marginBottom: 14 },
  catTitle: { fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  exerciseList: { maxHeight: 320 },
  exItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1, marginBottom: 6, gap: 10,
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  summary: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  cfgList: { maxHeight: 320 },
  cfgCard: { marginVertical: 4 },
  cfgHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  cfgBody: { marginTop: 8 },
  row: { flexDirection: 'row', width: '100%' },
  half: { flex: 1 },
  gapL: { marginLeft: 8 },
  // Novas classes de estilo
  modalStepActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  modalStepActionBtn: {
    flex: 1,
    marginVertical: 0,
  },
  studentSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  studentAvatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
