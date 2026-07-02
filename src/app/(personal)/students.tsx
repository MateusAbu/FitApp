import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, ChevronRight, UserPlus } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';

export default function Students() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const theme = useTheme();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'active' | 'inactive'>('active');

  const { data: students, isLoading } = useQuery({
    queryKey: ['personal-students', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('personal_id', profile.id)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const handleStudentPress = (student: any) => {
    router.push({
      pathname: '/(personal)/student-detail',
      params: { studentId: student.id, studentName: student.full_name || 'Aluno' },
    });
  };

  const activeCount = students?.filter((s: any) => s.status === 'active').length || 0;
  const inactiveCount = students?.filter((s: any) => s.status === 'inactive').length || 0;

  const filteredStudents = students?.filter((s: any) => {
    const matchesStatus = s.status === filter;
    const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.goal?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 85) return theme.success;
    if (adherence >= 65) return theme.warn;
    return theme.danger;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="caption" colorType="textDim" style={styles.subtitle}>
            {activeCount} {t('personal.students.activeCount', 'ativos')} · {inactiveCount} {t('personal.students.inactiveCount', 'inativos')}
          </Typography>
          <Typography variant="h1" style={styles.title}>
            {t('personal.students.studentTab', 'Alunos')}
          </Typography>
        </View>
        <TouchableOpacity
          style={[styles.inviteButton, { backgroundColor: theme.primaryColor }]}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.2} />
          <Typography variant="bold" style={styles.inviteText}>{t('personal.students.inviteBtn', 'Convidar')}</Typography>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Search size={16} color={theme.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('personal.students.searchPlaceholder', 'Buscar aluno, objetivo, plano...')}
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          keyboardAppearance="dark"
        />
        <Filter size={16} color={theme.textMuted} />
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          onPress={() => setFilter('active')}
          style={[
            styles.filterPill,
            filter === 'active' 
              ? { backgroundColor: theme.primaryColor, borderColor: 'transparent' }
              : { backgroundColor: theme.surface, borderColor: theme.border }
          ]}
        >
          <Typography
            variant="bold"
            style={{
              fontSize: 13,
              color: filter === 'active' ? '#FFFFFF' : theme.textDim
            }}
          >
            {t('personal.students.activeCount', 'Ativos')} · {activeCount}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('inactive')}
          style={[
            styles.filterPill,
            filter === 'inactive' 
              ? { backgroundColor: theme.primaryColor, borderColor: 'transparent' }
              : { backgroundColor: theme.surface, borderColor: theme.border }
          ]}
        >
          <Typography
            variant="bold"
            style={{
              fontSize: 13,
              color: filter === 'inactive' ? '#FFFFFF' : theme.textDim
            }}
          >
            {t('personal.students.inactiveCount', 'Inativos')} · {inactiveCount}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {isLoading ? (
        <Typography variant="body" colorType="textDim" style={styles.centerText}>
          {t('personal.students.loading', 'Carregando alunos...')}
        </Typography>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <UserPlus size={48} color={theme.textMuted} />
          <Typography variant="h2" style={styles.emptyTitle}>
            {t('personal.students.emptyTitle', 'Nenhum aluno encontrado')}
          </Typography>
          <Typography variant="body" colorType="textDim" style={styles.emptyText}>
            {t('personal.students.emptyText', 'Não encontramos alunos com os filtros aplicados. Compartilhe seu código para convidar.')}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const initials = getInitials(item.full_name || 'Aluno');
            const adherence = item.adherence || 0;
            const alerts = item.alerts || 0;
            
            return (
              <TouchableOpacity
                onPress={() => handleStudentPress(item)}
                activeOpacity={0.7}
              >
                <Card padding={14} style={styles.studentCard}>
                  <View style={styles.studentRow}>
                    <View style={[styles.avatar, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}>
                      <Typography variant="bold" style={styles.avatarText}>{initials}</Typography>
                    </View>
                    
                    <View style={styles.studentInfo}>
                      <View style={styles.nameRow}>
                        <Typography variant="bold" style={styles.studentName}>
                          {item.full_name || 'Aluno Sem Nome'}
                        </Typography>
                        {alerts > 0 && (
                          <View style={[styles.alertBadge, { backgroundColor: theme.danger }]}>
                            <Typography variant="bold" style={styles.alertText}>{alerts}</Typography>
                          </View>
                        )}
                      </View>
                      
                      <Typography variant="caption" colorType="textDim" style={styles.studentGoalPlan}>
                        {item.goal || 'Foco'} · {item.plan || 'Sem plano'}
                      </Typography>

                      {/* Barra de adesão */}
                      <View style={styles.adherenceContainer}>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceHi }]}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${adherence}%`, 
                                backgroundColor: getAdherenceColor(adherence) 
                              }
                            ]} 
                          />
                        </View>
                        <Typography variant="mono" colorType="textDim" style={styles.adherenceText}>
                          {adherence}%
                        </Typography>
                      </View>
                    </View>

                    <ChevronRight size={16} color={theme.textMuted} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal de Convite */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={t('personal.students.inviteModalTitle', 'Convidar Novo Aluno')}
      >
        <Typography variant="body" colorType="textDim" style={styles.modalInstructions}>
          {t('personal.students.modalInstructions', 'Envie o código de convite abaixo para que o aluno digite no momento do cadastro. Isso o vinculará automaticamente a você.')}
        </Typography>

        <Card elevated style={styles.modalCodeCard}>
          <Typography variant="caption" colorType="textDim">
            {t('personal.students.inviteCodeLabel', 'Seu Código de Convite')}
          </Typography>
          <Typography variant="h1" colorType="primary" style={styles.modalCodeText}>
            {profile?.inviteCode || 'FIT-1234'}
          </Typography>
        </Card>

        <Button
          title={t('common.cancel', 'Fechar')}
          onPress={() => setModalVisible(false)}
          variant="secondary"
          full
        />
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
  inviteButton: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  inviteText: {
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingVertical: 8,
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
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  studentCard: {
    marginVertical: 4,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  studentName: {
    fontSize: 15,
  },
  alertBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  studentGoalPlan: {
    fontSize: 12.5,
    marginBottom: 6,
  },
  adherenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  adherenceText: {
    fontSize: 11,
    minWidth: 28,
    textAlign: 'right',
  },
  modalInstructions: {
    lineHeight: 20,
    marginBottom: 16,
  },
  modalCodeCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  modalCodeText: {
    fontSize: 32,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 0,
  },
});
