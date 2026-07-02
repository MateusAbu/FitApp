import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Search, X, Video, Image as ImageIcon, Edit, Trash2, ChevronDown, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
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
  description: string | null;
  image_url: string | null;
  personal_id: string | null;
}

interface NewExerciseForm {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: NewExerciseForm = {
  name: '',
  category: '',
  description: '',
  imageUrl: '',
};

const GROUPS = ['Todos', 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Core'];

// Premium Mock Stock Images representing the trainer's phone gallery
const MOCK_GALLERY_IMAGES = [
  { name: 'Supino Reto / Peitoral', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500' },
  { name: 'Puxada Dorsal / Costas', url: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=500' },
  { name: 'Agachamento Livre / Pernas', url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500' },
  { name: 'Rosca Biceps / Braços', url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500' },
  { name: 'Triceps Corda / Braços', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500' },
  { name: 'Abdominal Plank / Core', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500' },
];

export default function Exercises() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroup, setActiveGroup] = useState('Todos');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [form, setForm] = useState<NewExerciseForm>({ ...EMPTY_FORM });
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

  const handleSelectDeviceImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('personal.exercises.permissionRequired', 'Permissão necessária'), t('personal.exercises.permissionMessage', 'Precisamos de permissão para acessar sua galeria de fotos.'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateForm('imageUrl', result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(t('personal.exercises.errorSelectingImage', 'Erro ao selecionar imagem'), err.message || t('common.unexpectedError', 'Erro inesperado.'));
    }
  };

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises-library', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`personal_id.is.null,personal_id.eq.${profile?.id}`)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data as Exercise[]) || [];
    },
    enabled: !!profile?.id,
  });

  const filteredExercises = useMemo(() => {
    let result = exercises || [];

    if (activeGroup !== 'Todos') {
      const matchGroup = activeGroup.toLowerCase();
      result = result.filter(ex => 
        (ex.category?.toLowerCase() || '') === matchGroup ||
        (matchGroup === 'costas' && (ex.category?.toLowerCase() || '') === 'dorsal') ||
        (matchGroup === 'peito' && (ex.category?.toLowerCase() || '') === 'peitoral')
      );
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      result = result.filter(ex => ex.name.toLowerCase().includes(normalizedSearch));
    }

    return result;
  }, [exercises, activeGroup, searchTerm]);

  const saveMutation = useMutation({
    mutationFn: async (payload: NewExerciseForm) => {
      if (!profile?.id) throw new Error(t('personal.workouts.profileNotFound', 'Perfil não encontrado.'));
      if (!payload.name.trim()) throw new Error(t('personal.exercises.nameRequired', 'Nome é obrigatório.'));
      if (!payload.category.trim()) throw new Error(t('personal.exercises.categoryRequired', 'Categoria é obrigatória.'));

      if (editingExerciseId) {
        // Update exercise
        const { error } = await supabase
          .from('exercises')
          .update({
            name: payload.name.trim(),
            category: payload.category.trim(),
            description: payload.description.trim() || null,
            image_url: payload.imageUrl.trim() || null,
          })
          .eq('id', editingExerciseId);
        if (error) throw error;
      } else {
        // Insert new exercise
        const { error } = await supabase.from('exercises').insert({
          name: payload.name.trim(),
          category: payload.category.trim(),
          description: payload.description.trim() || null,
          image_url: payload.imageUrl.trim() || null,
          personal_id: profile.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises-library'] });
      Alert.alert(t('common.success', 'Sucesso'), editingExerciseId ? t('personal.exercises.exerciseUpdated', 'Exercício atualizado!') : t('personal.exercises.exerciseCreated', 'Exercício criado!'));
      closeCreateModal();
    },
    onError: (err: any) => {
      Alert.alert(t('personal.exercises.errorSavingExercise', 'Erro ao salvar exercício'), err.message || t('common.unexpectedError', 'Erro inesperado.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises-library'] });
      Alert.alert(t('common.success', 'Sucesso'), t('personal.exercises.exerciseDeleted', 'Exercício excluído com sucesso.'));
      setSelectedExercise(null);
    },
    onError: (err: any) => {
      Alert.alert(t('personal.exercises.errorDeletingExercise', 'Erro ao excluir'), err.message || t('common.unexpectedError', 'Erro inesperado.'));
    },
  });

  const handleEditPress = (ex: Exercise) => {
    setSelectedExercise(null);
    setEditingExerciseId(ex.id);
    setForm({
      name: ex.name,
      category: ex.category || '',
      description: ex.description || '',
      imageUrl: ex.image_url || '',
    });
    setCreateModalVisible(true);
  };

  const handleDeletePress = (id: string) => {
    Alert.alert(
      t('personal.exercises.deleteConfirmTitle', 'Confirmar Exclusão'),
      t('personal.exercises.deleteConfirm'),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        { text: t('common.delete', 'Excluir'), style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    );
  };

  const updateForm = (field: keyof NewExerciseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
    setCategoryDropdownOpen(false);
    setForm({ ...EMPTY_FORM });
    setEditingExerciseId(null);
  };

  const renderExerciseCard = ({ item }: { item: Exercise }) => {
    const isGlobal = item.personal_id === null;
    const fallbackLabel = item.name.split(' ')[0].toLowerCase();
    
    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => setSelectedExercise(item)}
        activeOpacity={0.8}
      >
        <Card padding={10} style={styles.exerciseCard}>
          <View style={styles.imageContainer}>
            {item.image_url ? (
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.surfaceHi }]}>
                <Typography variant="mono" colorType="textMuted" style={{ fontSize: 10 }}>{fallbackLabel}</Typography>
              </View>
            )}
            <View style={[styles.mediaIconOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              {isGlobal ? (
                <ImageIcon size={12} color="#FFF" />
              ) : (
                <Video size={12} color="#FFF" />
              )}
            </View>
          </View>
          <Typography variant="bold" style={styles.exerciseName} numberOfLines={2}>
            {item.name}
          </Typography>
          <Badge tone={isGlobal ? 'neutral' : 'primary'} style={styles.categoryBadge}>
            {t(`personal.exercises.group_${(item.category || 'Geral').toLowerCase()}`, item.category || 'Geral')}
          </Badge>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <View>
          <Typography variant="caption" colorType="textDim" style={styles.subtitle}>
            {t('personal.dashboard.studentCount', '{{count}} no total', { count: (exercises || []).length })}
          </Typography>
          <Typography variant="h1" style={styles.title}>
            {t('personal.exercises.title', 'Exercícios')}
          </Typography>
        </View>
        <TouchableOpacity 
          style={[styles.plusBtn, { backgroundColor: theme.primaryColor }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.2} />
          <Typography variant="bold" style={styles.plusText}>{t('common.new', 'Novo')}</Typography>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Search size={16} color={theme.textMuted} />
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={t('personal.exercises.searchPlaceholder', 'Buscar exercício...')}
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          keyboardAppearance="dark"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <X size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {GROUPS.map((g) => {
            const isSelected = activeGroup === g;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => setActiveGroup(g)}
                style={[
                  styles.categoryPill,
                  isSelected 
                    ? { backgroundColor: theme.primaryColor, borderColor: 'transparent' }
                    : { backgroundColor: theme.surface, borderColor: theme.border }
                ]}
              >
                <Typography 
                  variant="bold"
                  style={{
                    fontSize: 12.5,
                    color: isSelected ? '#FFFFFF' : theme.textDim
                  }}
                >
                  {t(`personal.exercises.group_${g.toLowerCase()}`, g)}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <Typography variant="body" colorType="textDim" style={styles.centerText}>
          {t('common.loading', 'Carregando...')}
        </Typography>
      ) : filteredExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Search size={48} color={theme.textMuted} />
          <Typography variant="body" colorType="textDim" style={styles.emptyText}>
            {t('personal.exercises.emptyExercises', 'Nenhum exercício encontrado.')}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseCard}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
        />
      )}

      {/* Modal de Detalhes do Exercício */}
      <Modal
        visible={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        title={t('personal.exercises.modalDetailTitle', 'Detalhes do Exercício')}
      >
        {selectedExercise && (
          <View>
            <View style={styles.modalBadgeRow}>
              <Badge tone="primary">
                {t(`personal.exercises.group_${(selectedExercise.category || 'Geral').toLowerCase()}`, selectedExercise.category || 'Geral')}
              </Badge>
              <Badge tone={selectedExercise.personal_id ? 'primary' : 'neutral'}>
                {selectedExercise.personal_id ? t('personal.exercises.customTag', 'Customizado') : t('personal.exercises.globalTag', 'Global')}
              </Badge>
            </View>

            {selectedExercise.image_url ? (
              <Image 
                source={{ uri: selectedExercise.image_url }} 
                style={styles.modalImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.modalImagePlaceholder, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}>
                <Typography variant="mono" colorType="textMuted">{t('personal.studentDetail.noPhoto', 'sem foto')}</Typography>
              </View>
            )}

            <Typography variant="bold" style={{ fontSize: 18, marginVertical: 12 }}>{selectedExercise.name}</Typography>

            <Typography variant="body" style={styles.modalDesc}>
              {selectedExercise.description || t('common.noDescription', 'Nenhuma descrição técnica disponível para este exercício.')}
            </Typography>

            {/* Custom Edit/Delete Actions */}
            {selectedExercise.personal_id !== null && (
              <View style={styles.modalActionsRow}>
                <Button 
                  title={t('common.edit', 'Editar')} 
                  variant="secondary"
                  style={{ flex: 1, marginRight: 8 }}
                  onPress={() => handleEditPress(selectedExercise)}
                >
                  <Edit size={16} color={theme.text} style={{ marginRight: 6 }} />
                </Button>
                <Button 
                  title={t('common.delete', 'Excluir')} 
                  variant="danger" 
                  style={{ flex: 1 }}
                  onPress={() => handleDeletePress(selectedExercise.id)}
                >
                  <Trash2 size={16} color={theme.danger} style={{ marginRight: 6 }} />
                </Button>
              </View>
            )}
          </View>
        )}
      </Modal>

      {/* Modal Criar/Editar Exercício */}
      <Modal
        visible={createModalVisible}
        onClose={closeCreateModal}
        title={editingExerciseId ? t('personal.exercises.modalEditTitle', 'Editar Exercício') : t('personal.exercises.modalNewTitle', 'Novo Exercício')}
      >
        <Input 
          label={t('personal.exercises.nameLabel', 'Nome do Exercício')} 
          placeholder={t('personal.exercises.namePlaceholder', 'Ex: Crucifixo Inclinado')} 
          value={form.name} 
          onChangeText={(v) => updateForm('name', v)} 
        />
        <View style={{ marginBottom: 16, zIndex: 10 }}>
          <Typography variant="bold" colorType="textDim" style={{ fontSize: 13, marginBottom: 8 }}>
            {t('personal.exercises.categoryLabel', 'Categoria / Grupo Muscular')}
          </Typography>
          <TouchableOpacity
            style={[styles.dropdownSelect, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}
            onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            activeOpacity={0.8}
          >
            <Typography style={{ color: form.category ? theme.text : theme.textMuted }}>
              {form.category ? t(`personal.exercises.group_${form.category.toLowerCase()}`, form.category) : t('personal.exercises.categoryPlaceholder', 'Selecione o grupo muscular...')}
            </Typography>
            <ChevronDown size={16} color={theme.textDim} />
          </TouchableOpacity>
          
          {categoryDropdownOpen && (
            <View style={[styles.dropdownOptions, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}>
              {['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Core'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.dropdownOptionItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    updateForm('category', cat);
                    setCategoryDropdownOpen(false);
                  }}
                >
                  <Typography style={{ color: theme.text }}>{t(`personal.exercises.group_${cat.toLowerCase()}`, cat)}</Typography>
                  {form.category === cat && <Check size={16} color={theme.primaryColor} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Input 
          label={t('personal.exercises.descLabel', 'Descrição Técnica')} 
          placeholder={t('personal.exercises.descPlaceholder', 'Ex: Realizar movimento concentrado...')} 
          value={form.description} 
          onChangeText={(v) => updateForm('description', v)}
          multiline
        />

        <Typography variant="bold" colorType="textDim" style={{ fontSize: 13, marginBottom: 8, marginTop: 12 }}>
          {t('personal.exercises.imagePickerLabel', 'Imagem do Exercício')}
        </Typography>
        {form.imageUrl ? (
          <View style={styles.formImagePreviewWrapper}>
            <Image source={{ uri: form.imageUrl }} style={styles.formImagePreview} />
            <TouchableOpacity
              style={[styles.removeFormImageBtn, { backgroundColor: theme.danger }]}
              onPress={() => updateForm('imageUrl', '')}
            >
              <X size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Typography variant="bold" style={{ color: '#FFF', fontSize: 12 }}>
                {t('common.remove', 'Remover')} {t('personal.exercises.imageTag', 'Imagem')}
              </Typography>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickerOptionsRow}>
            <TouchableOpacity 
              style={[styles.imagePickerOptionBtn, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}
              onPress={handleSelectDeviceImage}
            >
              <ImageIcon size={20} color={theme.primaryColor} />
              <Typography variant="bold" style={{ fontSize: 12, marginTop: 4 }}>{t('personal.exercises.btnSelectDevice', 'Galeria Celular')}</Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.imagePickerOptionBtn, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}
              onPress={() => setGalleryModalVisible(true)}
            >
              <Plus size={20} color={theme.primaryColor} />
              <Typography variant="bold" style={{ fontSize: 12, marginTop: 4 }}>{t('personal.exercises.btnSelectMock', 'Fotos Fitness')}</Typography>
            </TouchableOpacity>
          </View>
        )}

        <Input 
          label={t('personal.exercises.urlLabel', 'URL da Imagem (Opcional)')} 
          placeholder="https://images.unsplash.com/..." 
          value={form.imageUrl} 
          onChangeText={(v) => updateForm('imageUrl', v)} 
          keyboardType="url"
          autoCapitalize="none"
        />

        <Button 
          title={editingExerciseId ? t('common.save', 'Salvar') : t('personal.exercises.btnSaveExercise', 'Salvar Exercício')} 
          loading={saveMutation.isPending} 
          onPress={() => saveMutation.mutate({ ...form })} 
          style={styles.modalSaveBtn}
        />
      </Modal>

      {/* Modal Galeria Simulada */}
      <Modal
        visible={galleryModalVisible}
        onClose={() => setGalleryModalVisible(false)}
        title={t('personal.exercises.galleryModalTitle', 'Galeria do Telefone (Simulada)')}
      >
        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 12 }}>
          {t('personal.exercises.galleryModalSubtitle', 'Selecione uma foto da sua galeria de exercícios:')}
        </Typography>
        <View style={styles.galleryGrid}>
          {MOCK_GALLERY_IMAGES.map((img, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.galleryCard}
              onPress={() => {
                updateForm('imageUrl', img.url);
                setGalleryModalVisible(false);
              }}
            >
              <Image source={{ uri: img.url }} style={styles.galleryThumb} />
              <Typography variant="bold" style={{ fontSize: 10, textAlign: 'center', marginTop: 4 }} numberOfLines={1}>
                {img.name.split(' / ')[0]}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  plusBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    gap: 6,
  },
  categoryPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  centerText: {
    textAlign: 'center',
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  gridContent: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardContainer: {
    width: '48.5%',
  },
  exerciseCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 10,
    marginVertical: 0,
    height: 172,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaIconOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
    borderRadius: 6,
  },
  exerciseName: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    flex: 1,
  },
  categoryBadge: {
    marginTop: 4,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  modalDesc: {
    lineHeight: 20,
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 12,
  },
  dropdownSelect: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  dropdownOptions: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownOptionItem: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  formImagePreviewWrapper: {
    position: 'relative',
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  formImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeFormImageBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  imagePickerOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imagePickerOptionBtn: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtn: {
    marginTop: 16,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  galleryCard: {
    width: '46%',
    marginBottom: 10,
    alignItems: 'center',
  },
  galleryThumb: {
    width: '100%',
    height: 90,
    borderRadius: 8,
  },
});
