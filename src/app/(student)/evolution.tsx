import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Award, Image as ImageIcon, Flame, MessageSquare, Plus, Calendar } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';

interface MeasurementForm {
  weight: string;
  fatPercent: string;
  chest: string;
  waist: string;
  hips: string;
  bicepsLeft: string;
  bicepsRight: string;
  forearmLeft: string;
  forearmRight: string;
  thighLeft: string;
  thighRight: string;
  calfLeft: string;
  calfRight: string;
}

const EMPTY_MEASUREMENT_FORM: MeasurementForm = {
  weight: '',
  fatPercent: '',
  chest: '',
  waist: '',
  hips: '',
  bicepsLeft: '',
  bicepsRight: '',
  forearmLeft: '',
  forearmRight: '',
  thighLeft: '',
  thighRight: '',
  calfLeft: '',
  calfRight: '',
};

export default function StudentEvolution() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<MeasurementForm>({ ...EMPTY_MEASUREMENT_FORM });

  // Fetch Progress Entries (Workout feedback)
  const { data: progressList, isLoading: progressLoading } = useQuery({
    queryKey: ['student-my-progress-list', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch Body Measurements
  const { data: measurements } = useQuery({
    queryKey: ['student-my-measurements', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('student_measurements')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Save Measurement Mutation
  const saveMeasurementMutation = useMutation({
    mutationFn: async (payload: MeasurementForm) => {
      if (!profile?.id) throw new Error(t('student.evolution.errorProfileNotFound', 'Perfil não encontrado.'));
      if (!payload.weight.trim()) throw new Error(t('student.evolution.weightRequired', 'Peso é obrigatório.'));

      const { error } = await supabase
        .from('student_measurements')
        .insert({
          student_id: profile.id,
          weight: parseFloat(payload.weight) || 0,
          fat_percent: parseFloat(payload.fatPercent) || null,
          chest: parseFloat(payload.chest) || null,
          waist: parseFloat(payload.waist) || null,
          hips: parseFloat(payload.hips) || null,
          biceps_left: parseFloat(payload.bicepsLeft) || null,
          biceps_right: parseFloat(payload.bicepsRight) || null,
          forearm_left: parseFloat(payload.forearmLeft) || null,
          forearm_right: parseFloat(payload.forearmRight) || null,
          thigh_left: parseFloat(payload.thighLeft) || null,
          thigh_right: parseFloat(payload.thighRight) || null,
          calf_left: parseFloat(payload.calfLeft) || null,
          calf_right: parseFloat(payload.calfRight) || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-my-measurements'] });
      Alert.alert(t('common.success', 'Sucesso'), t('student.evolution.successAlert', 'Medidas registradas com sucesso!'));
      setModalVisible(false);
      setForm({ ...EMPTY_MEASUREMENT_FORM });
    },
    onError: (err: any) => {
      Alert.alert(t('student.evolution.saveError', 'Erro ao salvar'), err.message || t('common.unexpectedError', 'Erro inesperado.'));
    },
  });

  const updateForm = (field: keyof MeasurementForm, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  // Dynamic weight history based on measurements
  const weightHistory = measurements && measurements.length > 0
    ? [...measurements].reverse().map(m => m.weight).slice(-5)
    : [67.1, 66.5, 65.9, 65.2, 64.8];
  
  const maxWeight = Math.max(...weightHistory);
  const minWeight = Math.min(...weightHistory);

  const latestMeasure = measurements?.[0];

  const personalRecords = [
    { exercise: t('student.evolution.benchPress', 'Supino Reto'), maxLoad: 60, delta: '+5.0 kg', date: t('student.evolution.daysAgo', 'Há {{count}} dias', { count: 3 }) },
    { exercise: t('student.evolution.barbellRow', 'Remada Curvada'), maxLoad: 50, delta: '+3.0 kg', date: t('student.evolution.daysAgo', 'Há {{count}} dias', { count: 5 }) },
    { exercise: t('student.evolution.dumbbellPress', 'Desenvolvimento Halteres'), maxLoad: 16, delta: '+2.0 kg', date: t('student.evolution.weeksAgo', 'Há {{count}} sem', { count: 1 }) },
    { exercise: t('student.evolution.bicepsCurl', 'Rosca Direta'), maxLoad: 15, delta: '+1.5 kg', date: t('student.evolution.weeksAgo', 'Há {{count}} sem', { count: 1 }) },
  ];

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Typography variant="caption" colorType="primary" style={{ fontWeight: '600', letterSpacing: 1 }}>
              {t('student.evolution.subHeader', 'SEU DESEMPENHO')}
            </Typography>
            <Typography variant="h1" style={styles.titleText}>{t('student.evolution.title', 'Meu Progresso')}</Typography>
          </View>
          <TouchableOpacity 
            style={[styles.addMeasureBtn, { backgroundColor: theme.primaryColor }]}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={16} color="#FFF" />
            <Typography variant="bold" style={{ color: '#FFF', fontSize: 12 }}>{t('student.evolution.newMeasurementBtn', 'Medidas')}</Typography>
          </TouchableOpacity>
        </View>
        <Typography variant="body" colorType="textDim" style={{ marginTop: 6 }}>
          {t('student.evolution.subtitle', 'Monitore sua evolução física, cargas máximas e feedbacks do treinador.')}
        </Typography>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Typography variant="caption" colorType="textMuted">{t('student.evolution.currentWeight', 'Peso Atual')}</Typography>
          <View style={styles.metricRow}>
            <Typography variant="mono" style={styles.metricValue}>
              {latestMeasure ? latestMeasure.weight : '64.8'}
            </Typography>
            <Typography variant="caption" colorType="textDim" style={styles.metricUnit}>kg</Typography>
          </View>
          <Typography variant="caption" colorType="success" style={styles.metricTrend}>
            {t('student.evolution.weightTrend', 'Excelente ritmo')}
          </Typography>
        </Card>

        <Card style={styles.metricCard}>
          <Typography variant="caption" colorType="textMuted">{t('student.evolution.bfLabel', 'Gordura Corporal')}</Typography>
          <View style={styles.metricRow}>
            <Typography variant="mono" style={styles.metricValue}>
              {latestMeasure ? latestMeasure.fat_percent : '22.1'}
            </Typography>
            <Typography variant="caption" colorType="textDim" style={styles.metricUnit}>%</Typography>
          </View>
          <Typography variant="caption" colorType="textDim" style={styles.metricTrend}>
            {t('student.evolution.latestRecord', 'Último registro')}
          </Typography>
        </Card>
      </View>

      {/* Weight History Bar Chart */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <TrendingUp size={16} color={theme.primaryColor} style={{ marginRight: 6 }} />
            <Typography variant="bold" style={styles.chartTitle}>{t('student.evolution.weightHistory', 'Histórico de Peso (kg)')}</Typography>
          </View>
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

      {/* Latest Body Measurements (If any) */}
      {latestMeasure && (
        <Card padding={16} style={{ marginBottom: 16 }}>
          <Typography variant="bold" style={{ fontSize: 15, marginBottom: 12 }}>{t('student.evolution.measurementsHistory', 'Últimas Medidas Físicas (cm)')}</Typography>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ width: '45%' }}>
              <Typography variant="caption" colorType="textMuted">{t('student.evolution.chestLabel', 'Peitoral:')}</Typography>
              <Typography variant="bold">{latestMeasure.chest || '-'} cm</Typography>
            </View>
            <View style={{ width: '45%' }}>
              <Typography variant="caption" colorType="textMuted">{t('student.evolution.waistLabel', 'Cintura:')}</Typography>
              <Typography variant="bold">{latestMeasure.waist || '-'} cm</Typography>
            </View>
            <View style={{ width: '45%' }}>
              <Typography variant="caption" colorType="textMuted">{t('student.evolution.armsLabel', 'Braço (E / D):')}</Typography>
              <Typography variant="bold">{latestMeasure.biceps_left || '-'} / {latestMeasure.biceps_right || '-'} cm</Typography>
            </View>
            <View style={{ width: '45%' }}>
              <Typography variant="caption" colorType="textMuted">{t('student.evolution.forearmsLabel', 'Antebraço (E / D):')}</Typography>
              <Typography variant="bold">{latestMeasure.forearm_left || '-'} / {latestMeasure.forearm_right || '-'} cm</Typography>
            </View>
            <View style={{ width: '45%' }}>
              <Typography variant="caption" colorType="textMuted">{t('student.evolution.thighsLabel', 'Coxa (E / D):')}</Typography>
              <Typography variant="bold">{latestMeasure.thigh_left || '-'} / {latestMeasure.thigh_right || '-'} cm</Typography>
            </View>
            <View style={{ width: '45%' }}>
              <Typography variant="caption" colorType="textMuted">{t('student.evolution.calvesLabel', 'Panturrilha (E / D):')}</Typography>
              <Typography variant="bold">{latestMeasure.calf_left || '-'} / {latestMeasure.calf_right || '-'} cm</Typography>
            </View>
          </View>
        </Card>
      )}

      {/* Personal Records (PRs) */}
      <Card style={styles.prsCard}>
        <View style={styles.sectionHeader}>
          <Award size={18} color={theme.primaryColor} style={{ marginRight: 8 }} />
          <Typography variant="h2" style={{ marginBottom: 0 }}>{t('student.evolution.prsTitle', 'Recordes Pessoais (PRs)')}</Typography>
        </View>

        {personalRecords.map((item, idx) => (
          <View key={idx} style={[styles.prRow, { borderBottomColor: theme.border }]}>
            <View>
              <Typography variant="bold" style={styles.prName}>{item.exercise}</Typography>
              <Typography variant="caption" colorType="textMuted">{item.date}</Typography>
            </View>
            <View style={styles.prValues}>
              <Typography variant="mono" style={styles.prLoad}>{item.maxLoad} kg</Typography>
              <View style={[styles.deltaBadge, { backgroundColor: theme.primarySoft }]}>
                <Typography variant="caption" colorType="primary" style={{ fontWeight: '600', fontSize: 11 }}>
                  {item.delta}
                </Typography>
              </View>
            </View>
          </View>
        ))}
      </Card>

      {/* Progress Photos Gallery */}
      <View style={styles.photosSectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ImageIcon size={18} color={theme.primaryColor} style={{ marginRight: 8 }} />
          <Typography variant="mono" colorType="textMuted" style={{ fontSize: 12, fontWeight: 'bold' }}>
            {t('student.evolution.photosGallery', 'GALERIA DE FOTOS')}
          </Typography>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
        {progressList?.filter((pi: any) => pi.photo_url).map((pi: any, idx) => (
          <View key={idx} style={styles.photoContainer}>
            <View style={[styles.photoBox, { borderColor: theme.borderStrong, backgroundColor: theme.surfaceHi }]}>
              {pi.photo_url ? (
                <Image source={{ uri: pi.photo_url }} style={styles.galleryImage} />
              ) : (
                <ImageIcon size={20} color={theme.textMuted} />
              )}
              <Typography variant="mono" style={styles.photoBoxLabel}>
                {new Date(pi.created_at).toLocaleDateString(i18n.language || 'pt-BR', { day: '2-digit', month: 'short' })}
              </Typography>
            </View>
          </View>
        ))}
        {(!progressList || progressList.filter((pi: any) => pi.photo_url).length === 0) && (
          <Typography variant="body" colorType="textMuted" style={{ fontStyle: 'italic', marginVertical: 8 }}>
            {t('student.evolution.noPhotos', 'Sem fotos registradas nos treinos anteriores.')}
          </Typography>
        )}
      </ScrollView>

      {/* Feedbacks / Timeline History */}
      <Typography variant="h2" style={styles.timelineTitle}>{t('student.evolution.workoutHistoryTitle', 'Histórico de Treinos')}</Typography>

      {progressLoading ? (
        <Typography variant="body" colorType="textDim" style={styles.centerText}>
          {t('student.evolution.loadingHistory', 'Buscando histórico...')}
        </Typography>
      ) : progressList && progressList.length === 0 ? (
        <Typography variant="body" colorType="textMuted" style={styles.centerText}>
          {t('student.evolution.emptyHistory', 'Nenhum treino registrado. Comece a treinar para gerar seu histórico!')}
        </Typography>
      ) : (
        <FlatList
          data={progressList}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.timelineCard}>
              <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Flame size={16} color={theme.primaryColor} style={{ marginRight: 6 }} />
                  <Typography variant="bold">{t('student.evolution.workoutFinished', 'Treino Finalizado')}</Typography>
                </View>
                <Typography variant="caption" colorType="textMuted">
                  {new Date(item.created_at).toLocaleDateString(i18n.language || 'pt-BR')}
                </Typography>
              </View>

              <View style={styles.cardDetails}>
                {item.load !== null && (
                  <Typography variant="body" style={styles.loadBadge}>
                    {t('student.evolution.registeredLoad', 'Carga registrada:')} <Typography variant="bold" colorType="primary">{item.load} kg</Typography>
                  </Typography>
                )}

                {item.notes && (
                  <Typography variant="body" style={[styles.notesText, { color: theme.textDim }]}>
                    {t('student.evolution.notesLabel', 'Anotação:')} "{item.notes}"
                  </Typography>
                )}

                {item.feedback_personal && (
                  <View style={[styles.feedbackBox, { borderLeftColor: theme.primaryColor, backgroundColor: theme.surfaceLo }]}>
                    <View style={styles.feedbackTitleRow}>
                      <MessageSquare size={13} color={theme.primaryColor} style={{ marginRight: 4 }} />
                      <Typography variant="caption" colorType="primary" style={styles.feedbackTitle}>
                        {t('student.evolution.feedbackPersonal', 'Orientação do Personal:')}
                      </Typography>
                    </View>
                    <Typography variant="body" style={[styles.feedbackBody, { color: theme.textDim }]}>
                      "{item.feedback_personal}"
                    </Typography>
                  </View>
                )}
              </View>
            </Card>
          )}
        />
      )}

      {/* Modal Registrar Medidas */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={t('student.evolution.modalTitle', 'Registrar Medidas Físicas')}
      >
        <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled>
          <View style={styles.modalRow}>
            <View style={{ flex: 1 }}>
              <Input label={t('student.evolution.weightLabel', 'Peso Corporal (kg)')} placeholder="Ex: 72.5" keyboardType="numeric" value={form.weight} onChangeText={v => updateForm('weight', v)} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input label={t('student.evolution.bfLabel', '% Gordura (BF)')} placeholder="Ex: 14.5" keyboardType="numeric" value={form.fatPercent} onChangeText={v => updateForm('fatPercent', v)} />
            </View>
          </View>

          <View style={styles.modalRow}>
            <View style={{ flex: 1 }}>
              <Input label={t('student.evolution.chestLabel', 'Peitoral (cm)')} placeholder="Ex: 96" keyboardType="numeric" value={form.chest} onChangeText={v => updateForm('chest', v)} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input label={t('student.evolution.waistLabel', 'Cintura (cm)')} placeholder="Ex: 80" keyboardType="numeric" value={form.waist} onChangeText={v => updateForm('waist', v)} />
            </View>
          </View>

          <Input label={t('student.evolution.hipsLabel', 'Quadril (cm)')} placeholder="Ex: 94" keyboardType="numeric" value={form.hips} onChangeText={v => updateForm('hips', v)} />

          <View style={styles.modalRow}>
            <View style={{ flex: 1 }}>
              <Input label={t('student.evolution.bicepsLeftLabel', 'Bíceps Esq. (cm)')} placeholder="Ex: 34" keyboardType="numeric" value={form.bicepsLeft} onChangeText={v => updateForm('bicepsLeft', v)} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input label={t('student.evolution.bicepsRightLabel', 'Bíceps Dir. (cm)')} placeholder="Ex: 34" keyboardType="numeric" value={form.bicepsRight} onChangeText={v => updateForm('bicepsRight', v)} />
            </View>
          </View>

          <View style={styles.modalRow}>
            <View style={{ flex: 1 }}>
              <Input label={t('student.evolution.forearmLeftLabel', 'Antebraço Esq. (cm)')} placeholder="Ex: 28" keyboardType="numeric" value={form.forearmLeft} onChangeText={v => updateForm('forearmLeft', v)} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input label={t('student.evolution.forearmRightLabel', 'Antebraço Dir. (cm)')} placeholder="Ex: 28" keyboardType="numeric" value={form.forearmRight} onChangeText={v => updateForm('forearmRight', v)} />
            </View>
          </View>

          <View style={styles.modalRow}>
            <View style={{ flex: 1 }}>
              <Input label={t('student.evolution.thighLeftLabel', 'Coxa Esq. (cm)')} placeholder="Ex: 56" keyboardType="numeric" value={form.thighLeft} onChangeText={v => updateForm('thighLeft', v)} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input label={t('student.evolution.thighRightLabel', 'Coxa Dir. (cm)')} placeholder="Ex: 56" keyboardType="numeric" value={form.thighRight} onChangeText={v => updateForm('thighRight', v)} />
            </View>
          </View>

          <View style={styles.modalRow}>
            <View style={{ flex: 1 }}>
              <Input label={t('student.evolution.calfLeftLabel', 'Panturrilha Esq. (cm)')} placeholder="Ex: 37" keyboardType="numeric" value={form.calfLeft} onChangeText={v => updateForm('calfLeft', v)} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input label={t('student.evolution.calfRightLabel', 'Panturrilha Dir. (cm)')} placeholder="Ex: 37" keyboardType="numeric" value={form.calfRight} onChangeText={v => updateForm('calfRight', v)} />
            </View>
          </View>
        </ScrollView>

        <Button 
          title={t('student.evolution.saveBtn', 'Salvar Medidas')}
          loading={saveMeasurementMutation.isPending}
          onPress={() => saveMeasurementMutation.mutate(form)}
          style={{ marginTop: 16 }}
        />
      </Modal>
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
    marginBottom: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  addMeasureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    padding: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  metricUnit: {
    marginLeft: 2,
    fontSize: 12,
  },
  metricTrend: {
    fontSize: 11,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 15,
    marginBottom: 0,
  },
  customBarChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 14,
    borderRadius: 7,
  },
  chartBarLabel: {
    fontSize: 9,
    marginTop: 6,
  },
  prsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  prName: {
    fontSize: 14,
  },
  prValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prLoad: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photosScroll: {
    paddingVertical: 4,
    marginBottom: 24,
  },
  photoContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  photoBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  photoBoxLabel: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    color: '#FFF',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  centerText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  timelineCard: {
    marginBottom: 12,
    borderRadius: 14,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDetails: {
    padding: 12,
  },
  loadBadge: {
    fontSize: 13,
    marginBottom: 4,
  },
  notesText: {
    fontStyle: 'italic',
    fontSize: 13,
    marginBottom: 6,
  },
  feedbackBox: {
    borderLeftWidth: 3,
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  feedbackTitle: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  feedbackBody: {
    fontStyle: 'italic',
    fontSize: 12,
  },
  modalRow: {
    flexDirection: 'row',
    width: '100%',
  },
});
