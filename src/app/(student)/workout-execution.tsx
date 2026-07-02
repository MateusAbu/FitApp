import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, Camera, X, Check } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';

const MOCK_EVOLUTION_PHOTOS = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500',
];

export default function WorkoutExecution() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const workoutId = params.workoutId as string;
  const workoutName = params.workoutName as string || 'Treino';

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Per-exercise state: Record<workout_exercise_id, { load, notes }>
  const [exerciseInputs, setExerciseInputs] = useState<Record<string, { load: string; notes: string }>>({});
  
  // Overall comments and progress photo
  const [generalComment, setGeneralComment] = useState('');
  const [evolutionPhotoUrl, setEvolutionPhotoUrl] = useState('');
  const [galleryVisible, setGalleryVisible] = useState(false);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['workout-exercises-details', workoutId],
    queryFn: async () => {
      if (!workoutId) return [];
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*, exercises:exercise_id(name, category, description)')
        .eq('workout_id', workoutId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!workoutId,
  });

  // Pre-fill exercise inputs when exercise list loads
  useEffect(() => {
    if (exercises && exercises.length > 0) {
      const initial: Record<string, { load: string; notes: string }> = {};
      exercises.forEach((item: any) => {
        initial[item.id] = {
          load: item.load != null ? String(item.load) : '',
          notes: item.advanced_notes || '',
        };
      });
      setExerciseInputs(initial);
    }
  }, [exercises]);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setSeconds(0);
    setIsActive(false);
  };

  const logProgressMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !workoutId) return;

      // 1. Insert overall progress log (optional)
      const generalProgress = {
        student_id: profile.id,
        personal_id: profile.personalId || 'demo-personal-id',
        workout_id: workoutId,
        load: null,
        photo_url: evolutionPhotoUrl || null,
        notes: generalComment || null,
      };

      const { error: genError } = await supabase
        .from('student_progress')
        .insert(generalProgress);
      if (genError) throw genError;

      // 2. Loop through exercises and log individual stats
      for (const item of (exercises || [])) {
        const inputs = exerciseInputs[item.id];
        if (inputs) {
          const loadNum = inputs.load ? parseFloat(inputs.load) : null;
          const notesText = inputs.notes || null;

          if (loadNum !== null || notesText !== null) {
            const exerciseProgress = {
              student_id: profile.id,
              personal_id: profile.personalId || 'demo-personal-id',
              workout_id: workoutId,
              exercise_id: item.exercise_id,
              load: loadNum,
              notes: notesText,
              photo_url: null,
            };
            await supabase.from('student_progress').insert(exerciseProgress);
          }

          // Update student's active sheet load and notes
          await supabase
            .from('workout_exercises')
            .update({
              load: loadNum,
              advanced_notes: notesText,
            })
            .eq('id', item.id);
        }
      }
    },
    onSuccess: () => {
      Alert.alert(t('common.success', 'Sucesso'), t('student.execution.finishSuccess', 'Treino concluído com sucesso! Bom trabalho!'));
      resetTimer();
      setGeneralComment('');
      setEvolutionPhotoUrl('');
      router.replace('/(student)');
    },
    onError: (err: any) => {
      Alert.alert(t('common.error', 'Erro'), err.message || t('student.execution.saveProgressError', 'Não foi possível registrar o progresso.'));
    },
  });

  if (!workoutId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg || theme.backgroundColor, justifyContent: 'center' }]}>
        <Typography variant="body" colorType="textDim" style={styles.centerText}>
          {t('student.execution.selectWorkoutFirst', 'Selecione uma ficha de treino na tela inicial para iniciar a execução.')}
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg || theme.backgroundColor }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography variant="h1">{workoutName}</Typography>
        <Typography variant="body" colorType="textDim">
          {t('student.execution.subtitle', 'Acompanhe suas cargas e execute os intervalos com precisão.')}
        </Typography>
      </View>

      <Card style={styles.timerCard}>
        <Typography variant="caption" colorType="textDim">
          {t('student.execution.elapsedTimeLabel', 'Tempo de Treino')}
        </Typography>
        <Typography variant="mono" style={styles.timerText}>
          {formatTime(seconds)}
        </Typography>
        <View style={styles.timerControls}>
          <TouchableOpacity
            style={[styles.timerButton, { backgroundColor: theme.primaryColor }]}
            onPress={toggleTimer}
          >
            {isActive ? <Pause size={18} color="#000" fill="#000" /> : <Play size={18} color="#000" fill="#000" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timerButton, styles.resetButton, { backgroundColor: theme.surfaceHi }]}
            onPress={resetTimer}
          >
            <RotateCcw size={18} color={theme.textDim} />
          </TouchableOpacity>
        </View>
      </Card>

      <Typography variant="h2" style={styles.sectionTitle}>
        {t('student.execution.exercisesToPerform', 'Exercícios a Realizar')}
      </Typography>

      {isLoading ? (
        <Typography variant="body" colorType="textDim" style={styles.centerText}>
          {t('personal.studentDetail.loadingExercises', 'Buscando exercícios...')}
        </Typography>
      ) : (
        exercises?.map((item: any) => {
          const inputs = exerciseInputs[item.id] || { load: '', notes: '' };
          return (
            <Card key={item.id} style={styles.exerciseCard}>
              <Typography variant="bold" style={styles.exerciseName}>
                {item.exercises?.name}
              </Typography>
              <View style={[styles.exerciseParams, { backgroundColor: theme.surfaceLo, borderColor: theme.border, borderWidth: 1 }]}>
                <View style={styles.paramBox}>
                  <Typography variant="caption" colorType="textMuted">{t('personal.workouts.setsLabel', 'Séries')}</Typography>
                  <Typography variant="bold">{item.sets}</Typography>
                </View>
                <View style={styles.paramBox}>
                  <Typography variant="caption" colorType="textMuted">{t('personal.workouts.repsLabel', 'Repetições')}</Typography>
                  <Typography variant="bold">{item.reps}</Typography>
                </View>
                <View style={styles.paramBox}>
                  <Typography variant="caption" colorType="textMuted">{t('personal.workouts.restLabel', 'Descanso')}</Typography>
                  <Typography variant="bold">{item.rest_seconds}s</Typography>
                </View>
              </View>

              {/* Inputs para Peso e Nota do Exercício */}
              <View style={styles.executionInputsRow}>
                <View style={{ flex: 1.2 }}>
                  <Input
                    label={t('personal.workouts.loadLabel', 'Carga (kg)')}
                    placeholder={t('student.execution.loadPlaceholder', 'Ex: 20')}
                    keyboardType="numeric"
                    value={inputs.load}
                    onChangeText={(val) => setExerciseInputs(prev => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], load: val }
                    }))}
                  />
                </View>
                <View style={{ flex: 2, marginLeft: 8 }}>
                  <Input
                    label={t('student.execution.technicalNotes', 'Nota Técnica')}
                    placeholder={t('student.execution.notesPlaceholder', 'Ex: Banco altura 3')}
                    value={inputs.notes}
                    onChangeText={(val) => setExerciseInputs(prev => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], notes: val }
                    }))}
                  />
                </View>
              </View>

              {item.exercises?.description && (
                <Typography variant="caption" colorType="textDim" style={styles.descText}>
                  {item.exercises.description}
                </Typography>
              )}
            </Card>
          );
        })
      )}

      {/* Card Finalização */}
      <Card style={styles.logCard}>
        <Typography variant="h2" style={styles.logCardTitle}>
          {t('student.execution.registerFinishTitle', 'Registrar Conclusão (Opcionais)')}
        </Typography>

        <Input
          label={t('student.execution.finalComments', 'Comentários Finais (Opcional)')}
          placeholder={t('student.execution.commentsPlaceholder', 'Conte ao seu personal como foi o treino...')}
          value={generalComment}
          onChangeText={setGeneralComment}
          multiline
        />

        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 6, fontWeight: 'bold' }}>
          {t('student.execution.evolutionPhoto', 'Foto de Evolução (Opcional)')}
        </Typography>
        {evolutionPhotoUrl ? (
          <View style={styles.selectedPhotoWrapper}>
            <Image source={{ uri: evolutionPhotoUrl }} style={styles.selectedPhotoThumb} />
            <TouchableOpacity 
              style={[styles.removePhotoBtn, { backgroundColor: theme.danger }]}
              onPress={() => setEvolutionPhotoUrl('')}
            >
              <X size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.galleryButton, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}
            onPress={() => setGalleryVisible(true)}
          >
            <Camera size={20} color={theme.primaryColor} />
            <Typography variant="bold" style={{ fontSize: 11, marginTop: 4 }}>{t('student.execution.selectPhotoBtn', 'Selecionar da Galeria')}</Typography>
          </TouchableOpacity>
        )}

        <Button
          title={t('student.execution.finishBtn', 'Concluir Treino')}
          loading={logProgressMutation.isPending}
          onPress={() => logProgressMutation.mutate()}
          style={styles.finishBtn}
        />
      </Card>

      {/* Modal Galeria do Estudante */}
      <Modal
        visible={galleryVisible}
        onClose={() => setGalleryVisible(false)}
        title={t('personal.exercises.galleryModalTitle', 'Galeria do Telefone (Simulada)')}
      >
        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 12 }}>
          {t('student.execution.gallerySubtitle', 'Escolha uma foto para seu registro de evolução:')}
        </Typography>
        <View style={styles.galleryGrid}>
          {MOCK_EVOLUTION_PHOTOS.map((url, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.galleryCard}
              onPress={() => {
                setEvolutionPhotoUrl(url);
                setGalleryVisible(false);
              }}
            >
              <Image source={{ uri: url }} style={styles.galleryThumb} />
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  centerText: {
    textAlign: 'center',
    marginTop: 20,
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    marginVertical: 12,
    letterSpacing: 2,
  },
  timerControls: {
    flexDirection: 'row',
  },
  timerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 2,
  },
  resetButton: {
    // Background set dynamically inline
  },
  sectionTitle: {
    marginBottom: 12,
  },
  exerciseCard: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    marginBottom: 8,
  },
  exerciseParams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  paramBox: {
    alignItems: 'center',
    flex: 1,
  },
  executionInputsRow: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 4,
  },
  descText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  logCard: {
    marginTop: 16,
    marginBottom: 40,
  },
  logCardTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  finishBtn: {
    marginTop: 16,
  },
  galleryButton: {
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  selectedPhotoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  selectedPhotoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  galleryCard: {
    width: '46%',
    marginBottom: 12,
  },
  galleryThumb: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
});
