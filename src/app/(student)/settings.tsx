import React, { useState } from 'react';
import { View, StyleSheet, Alert, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Shield, FileText, Trash2, Paperclip, Plus, Globe, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';

export default function StudentSettings() {
  const { t, i18n } = useTranslation();
  const { profile, logout } = useAuthStore();
  const { resetTheme } = useThemeStore();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [docModalVisible, setDocModalVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logout();
      resetTheme();
    } catch (e: any) {
      Alert.alert('Erro ao sair', e.message);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Query shared documents
  const { data: documents } = useQuery({
    queryKey: ['student-my-documents', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Add Document Mutation
  const addDocumentMutation = useMutation({
    mutationFn: async (payload: { name: string; type: string }) => {
      if (!profile?.id) throw new Error('Perfil não encontrado.');
      const { error } = await supabase
        .from('student_documents')
        .insert({
          student_id: profile.id,
          name: payload.name,
          url: 'https://placeholder.pdf/' + payload.name.toLowerCase().replace(/\s+/g, '_'),
          type: payload.type,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-my-documents'] });
      Alert.alert('Sucesso', 'Documento compartilhado com seu Personal!');
      setDocModalVisible(false);
    },
    onError: (e: any) => {
      Alert.alert('Erro ao enviar', e.message || 'Erro inesperado.');
    }
  });

  // Delete Document Mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-my-documents'] });
      Alert.alert('Sucesso', 'Documento removido.');
    },
    onError: (e: any) => {
      Alert.alert('Erro ao deletar', e.message || 'Erro inesperado.');
    }
  });

  const handleSimulateUpload = (type: string, name: string) => {
    addDocumentMutation.mutate({ name, type });
  };

  const handleDeleteDoc = (id: string) => {
    Alert.alert(
      'Remover Documento',
      'Tem certeza que deseja remover este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => deleteDocumentMutation.mutate(id) },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <Card style={styles.card}>
        <View style={[styles.profileHeader, { borderBottomColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
            <Typography variant="bold" colorType="primary" style={{ fontSize: 16 }}>
              {getInitials(profile?.fullName || 'Aluno')}
            </Typography>
          </View>
          <View style={styles.profileInfo}>
            <Typography variant="h2" style={styles.userName}>
              {profile?.fullName || 'Aluno'}
            </Typography>
            <Typography variant="caption" colorType="textDim">
              {profile?.email}
            </Typography>
          </View>
        </View>

        <View style={styles.rowItem}>
          <Typography variant="body" colorType="textDim">{t('student.settings.goalText', 'Objetivo:')}</Typography>
          <Typography variant="bold" colorType="primary">{profile?.goal || 'Hipertrofia'}</Typography>
        </View>
        <View style={styles.rowItem}>
          <Typography variant="body" colorType="textDim">{t('student.settings.planText', 'Ficha:')}</Typography>
          <Typography variant="bold">{profile?.plan || 'Padrão'}</Typography>
        </View>
      </Card>

      {/* Shared Documents Card */}
      <Card style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Paperclip size={16} color={theme.primaryColor} style={{ marginRight: 6 }} />
            <Typography variant="bold" style={styles.sectionTitle}>
              {t('student.settings.sharePdfTitle')}
            </Typography>
          </View>
          <TouchableOpacity 
            style={[styles.addDocBtn, { backgroundColor: theme.primarySoft }]}
            onPress={() => setDocModalVisible(true)}
          >
            <Plus size={14} color={theme.primaryColor} />
            <Typography variant="bold" colorType="primary" style={{ fontSize: 11 }}>{t('student.settings.sendBtn', 'Enviar')}</Typography>
          </TouchableOpacity>
        </View>

        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 12 }}>
          {t('student.settings.sharePdfDesc', 'Envie planos alimentares, atestados médicos ou avaliações físicas para seu treinador:')}
        </Typography>

        {documents && documents.length > 0 ? (
          documents.map((doc: any) => (
            <View key={doc.id} style={[styles.docItem, { borderBottomColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                <FileText size={16} color={theme.textDim} />
                <View style={{ flex: 1 }}>
                  <Typography variant="bold" style={{ fontSize: 13 }} numberOfLines={1}>
                    {doc.name}
                  </Typography>
                  <Typography variant="caption" colorType="textMuted">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </Typography>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteDoc(doc.id)}>
                <Trash2 size={16} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Typography variant="body" colorType="textMuted" style={{ fontStyle: 'italic', textAlign: 'center', marginVertical: 8 }}>
            {t('student.settings.noPdfSelected', 'Nenhum documento compartilhado ainda.')}
          </Typography>
        )}
      </Card>

      {/* Trainer Brand Card */}
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Shield size={16} color={theme.primaryColor} style={{ marginRight: 6 }} />
          <Typography variant="bold" style={styles.sectionTitle}>
            {t('student.settings.myAdvisory', 'Minha Assessoria')}
          </Typography>
        </View>
        
        <View style={styles.rowItem}>
          <Typography variant="body" colorType="textDim">{t('student.settings.trainerBrand', 'Marca do Personal:')}</Typography>
          <Typography variant="bold" colorType="primary">{theme.brandName}</Typography>
        </View>
        <View style={styles.rowItem}>
          <Typography variant="body" colorType="textDim">{t('student.settings.statusAdvisory', 'Status da Assessoria:')}</Typography>
          <Typography variant="bold" colorType="success">{t('student.settings.statusAdvisoryActive', 'Vinculado & Ativo')}</Typography>
        </View>
      </Card>

      {/* Theme Visual */}
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Shield size={16} color={theme.primaryColor} style={{ marginRight: 6 }} />
          <Typography variant="bold" style={styles.sectionTitle}>
            {t('student.settings.themeTitle', 'Tema Visual')}
          </Typography>
        </View>
        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 12 }}>
          {t('student.settings.themeSubtitle', 'Alterne entre o visual Escuro Premium e Claro Moderno:')}
        </Typography>
        <View style={styles.rowItem}>
          <Typography variant="bold" style={{ fontSize: 13.5 }}>
            {t('student.settings.darkMode', 'Modo Escuro (Dark Mode)')}
          </Typography>
          <Switch
            value={useThemeStore((state) => state.isDarkMode)}
            onValueChange={() => useThemeStore.getState().toggleThemeMode()}
            trackColor={{ false: '#D1D5DB', true: theme.primaryColor }}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </Card>

      {/* Language Selector */}
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Globe size={16} color={theme.primaryColor} style={{ marginRight: 6 }} />
          <Typography variant="bold" style={styles.sectionTitle}>
            {t('student.settings.languageSection')}
          </Typography>
        </View>
        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 12 }}>
          {t('student.settings.selectLang')}
        </Typography>
        <View style={styles.languageOptionsRow}>
          {[
            { code: 'pt', label: 'Português 🇧🇷' },
            { code: 'en', label: 'English 🇺🇸' },
            { code: 'es', label: 'Español 🇪🇸' },
          ].map((lang) => {
            const isSelected = i18n.language?.startsWith(lang.code);
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={async () => {
                  await i18n.changeLanguage(lang.code);
                  await AsyncStorage.setItem('user-language', lang.code);
                }}
                style={[
                  styles.langPill,
                  isSelected
                    ? { backgroundColor: theme.primaryColor, borderColor: 'transparent' }
                    : { backgroundColor: theme.surfaceLo, borderColor: theme.border }
                ]}
              >
                <Typography
                  variant="bold"
                  style={{
                    fontSize: 12.5,
                    color: isSelected ? '#FFFFFF' : theme.textDim
                  }}
                >
                  {lang.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Logout */}
      <Button
        title={t('student.settings.logoutBtn')}
        variant="ghost"
        onPress={handleLogout}
        style={styles.logoutBtn}
      >
        <View style={styles.logoutContent}>
          <LogOut size={16} color={theme.danger} style={{ marginRight: 6 }} />
          <Typography variant="bold" colorType="danger">
            {t('student.settings.logoutBtn')}
          </Typography>
        </View>
      </Button>

      {/* Modal Upload Documento Simulado */}
      <Modal
        visible={docModalVisible}
        onClose={() => setDocModalVisible(false)}
        title={t('student.settings.sharePdfTitle')}
      >
        <Typography variant="caption" colorType="textDim" style={{ marginBottom: 16 }}>
          {t('student.settings.selectPdfDesc', 'Escolha um documento para enviar para o seu Personal Trainer:')}
        </Typography>
        
        <TouchableOpacity 
          style={[styles.simulatedDocCard, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}
          onPress={() => handleSimulateUpload('plano_alimentar', 'Dieta Hipertrofia Maio.pdf')}
        >
          <FileText size={20} color={theme.primaryColor} />
          <View>
            <Typography variant="bold" style={{ fontSize: 13.5 }}>Dieta Hipertrofia Maio.pdf</Typography>
            <Typography variant="caption" colorType="textMuted">{t('student.settings.pdfDiet', 'Plano Alimentar')}</Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.simulatedDocCard, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}
          onPress={() => handleSimulateUpload('documento_medico', 'Atestado Medico Aptidao.pdf')}
        >
          <FileText size={20} color={theme.primaryColor} />
          <View>
            <Typography variant="bold" style={{ fontSize: 13.5 }}>Atestado Medico Aptidao.pdf</Typography>
            <Typography variant="caption" colorType="textMuted">{t('student.settings.pdfExam', 'Atestado Médico / Liberação')}</Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.simulatedDocCard, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}
          onPress={() => handleSimulateUpload('outro', 'Avaliacao de Bioimpedancia.pdf')}
        >
          <FileText size={20} color={theme.primaryColor} />
          <View>
            <Typography variant="bold" style={{ fontSize: 13.5 }}>Avaliacao de Bioimpedancia.pdf</Typography>
            <Typography variant="caption" colorType="textMuted">{t('student.settings.pdfTraining', 'Métricas / Resultados')}</Typography>
          </View>
        </TouchableOpacity>
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
  card: {
    marginBottom: 16,
    borderRadius: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 0,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  logoutBtn: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 98, 92, 0.2)',
    borderRadius: 12,
    height: 48,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  simulatedDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  languageOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  langPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
