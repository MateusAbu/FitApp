import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { Sparkles, Palette, Check, LogOut, User, Image as ImageIcon, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore, themePalettes } from '../../store/useThemeStore';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../services/supabase';
import { Typography } from '../../shared/components/Typography';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { PlanCard } from '../../shared/components/PlanCard';
import { checkPremiumStatus } from '../../shared/utils/premium';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { profile, logout } = useAuthStore();
  const { setTheme, resetTheme } = useThemeStore();
  const theme = useTheme();
  const isPremium = checkPremiumStatus(profile?.email, profile?.isPremium);

  const [brandName, setBrandName] = useState(theme.brandName);
  const [logoUrl, setLogoUrl] = useState(theme.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor);
  const [loadingBranding, setLoadingBranding] = useState(false);

  const handleUpdateBranding = async () => {
    if (!brandName) {
      Alert.alert('Erro', 'O nome da marca é obrigatório.');
      return;
    }
    if (!profile?.id) return;

    if (!isPremium) {
      Alert.alert(
        'Acesso Restrito',
        'A personalização de marca (White-Label) está disponível apenas no plano Premium. Adicione seu e-mail à lista de testes no arquivo premium.ts para liberar gratuitamente.'
      );
      return;
    }

    setLoadingBranding(true);
    try {
      const themeData = {
        personal_id: profile.id,
        brand_name: brandName,
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        background_color: theme.backgroundColor,
        text_color: theme.textColor,
      };

      const { error } = await supabase
        .from('personal_themes')
        .upsert(themeData);

      if (error) throw error;

      setTheme({
        brandName,
        logoUrl: logoUrl || null,
        primaryColor,
        secondaryColor,
      });

      Alert.alert('Sucesso', 'Configurações de marca salvas e aplicadas em tempo de execução!');
    } catch (e: any) {
      Alert.alert('Erro ao atualizar marca', e.message || 'Erro inesperado.');
    } finally {
      setLoadingBranding(false);
    }
  };

  const selectPreset = (key: keyof typeof themePalettes) => {
    const palette = themePalettes[key];
    setBrandName(palette.brandName);
    setPrimaryColor(palette.primaryColor);
    setSecondaryColor(palette.secondaryColor);
    setTheme(palette);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logout();
      resetTheme();
    } catch (e: any) {
      Alert.alert('Erro ao sair', e.message);
    }
  };

  const isPresetActive = (palette: typeof themePalettes.forge) => {
    return theme.primaryColor === palette.primaryColor && theme.brandName === palette.brandName;
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <Card style={styles.sectionCard}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
            <User size={24} color={theme.primaryColor} />
          </View>
          <View style={styles.profileInfo}>
            <Typography variant="h2" style={styles.userName}>
              {profile?.fullName || 'Personal Trainer'}
            </Typography>
            <Typography variant="caption" colorType="textDim">
              {profile?.email}
            </Typography>
          </View>
        </View>
        <View style={[styles.roleBadgeContainer, { borderTopColor: theme.border }]}>
          <Typography variant="caption" colorType="primary" style={styles.roleText}>
            {t('personal.settings.roleText', 'Acesso • Personal Trainer')}
          </Typography>
        </View>
      </Card>

      {/* Theme Toggler */}
      <Card style={styles.sectionCard}>
        <View style={styles.titleRow}>
          <Palette size={18} color={theme.primaryColor} style={styles.titleIcon} />
          <Typography variant="h2" style={styles.sectionTitle}>
            {t('personal.settings.themeTitle', 'Tema Visual')}
          </Typography>
        </View>
        <Typography variant="caption" colorType="textDim" style={styles.sectionSubtitle}>
          {t('personal.settings.themeSubtitle', 'Alterne entre o visual Escuro Premium e Claro Moderno:')}
        </Typography>
        <View style={styles.themeToggleRow}>
          <Typography variant="bold" style={{ fontSize: 14 }}>
            {t('personal.settings.darkMode', 'Modo Escuro (Dark Mode)')}
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
      <Card style={styles.sectionCard}>
        <View style={styles.titleRow}>
          <Globe size={18} color={theme.primaryColor} style={styles.titleIcon} />
          <Typography variant="h2" style={styles.sectionTitle}>
            {t('personal.settings.languageSection')}
          </Typography>
        </View>
        <Typography variant="caption" colorType="textDim" style={styles.sectionSubtitle}>
          {t('personal.settings.selectLang')}
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

      {/* Preset Palettes */}
      <Card style={styles.sectionCard}>
        <View style={styles.titleRow}>
          <Palette size={18} color={theme.primaryColor} style={styles.titleIcon} />
          <Typography variant="h2" style={styles.sectionTitle}>
            {t('personal.settings.presetsTitle', 'Paletas White-Label')}
          </Typography>
        </View>
        <Typography variant="caption" colorType="textDim" style={styles.sectionSubtitle}>
          {t('personal.settings.presetsSubtitle', 'Escolha uma identidade pré-definida para o seu aplicativo:')}
        </Typography>

        <View style={styles.presetGrid}>
          {(Object.keys(themePalettes) as Array<keyof typeof themePalettes>).map((key) => {
            const palette = themePalettes[key];
            const active = isPresetActive(palette);
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.presetCard,
                  { 
                    borderColor: active ? theme.primaryColor : theme.border,
                    backgroundColor: active ? theme.primarySoft : theme.surfaceLo
                  }
                ]}
                onPress={() => selectPreset(key)}
              >
                <View style={[styles.colorIndicator, { backgroundColor: palette.primaryColor }]}>
                  {active && <Check size={12} color="#000" style={styles.checkInsideColor} />}
                </View>
                <Typography variant="bold" style={styles.presetName}>
                  {palette.brandName}
                </Typography>
                <Typography variant="caption" colorType="textMuted">
                  Preset {key.toUpperCase()}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Live Preview & Custom Brand */}
      <Card style={styles.sectionCard}>
        <View style={styles.titleRow}>
          <Sparkles size={18} color={theme.primaryColor} style={styles.titleIcon} />
          <Typography variant="h2" style={styles.sectionTitle}>
            {t('personal.settings.brandingTitle')}
          </Typography>
        </View>

        {!isPremium && (
          <Card padding={10} style={{ backgroundColor: theme.primarySoft, borderColor: theme.primaryColor, marginBottom: 16 }}>
            <Typography variant="bold" colorType="primary" style={{ fontSize: 13, fontWeight: '700' }}>
              {t('personal.settings.premiumRestricted', '★ Recurso Restrito (Premium)')}
            </Typography>
            <Typography variant="caption" colorType="textDim" style={{ marginTop: 2, fontSize: 11 }}>
              {t('personal.settings.premiumRestrictedDesc', 'Assine um dos planos abaixo ou adicione seu e-mail de teste no arquivo \'premium.ts\' para liberar o acesso grátis.')}
            </Typography>
          </Card>
        )}

        {/* Live Preview Area */}
        <Typography variant="caption" colorType="textDim" style={styles.sectionSubtitle}>
          {t('personal.settings.brandingPreview', 'Visualização em Tempo Real (Cabeçalho do Aluno):')}
        </Typography>
        <View style={[styles.previewBanner, { backgroundColor: theme.surfaceLo, borderColor: theme.border }]}>
          <View style={styles.previewHeader}>
            {logoUrl ? (
              <ImageIcon size={18} color={theme.primaryColor} style={{ marginRight: 6 }} />
            ) : (
              <View style={[styles.miniLogo, { backgroundColor: theme.primaryColor }]} />
            )}
            <Typography variant="bold" style={{ fontSize: 13, color: theme.text }}>
              {brandName || t('personal.settings.defaultBrandName', 'Minha Marca')}
            </Typography>
          </View>
          <View style={[styles.previewStatus, { backgroundColor: theme.primarySoft }]}>
            <Typography variant="caption" colorType="primary" style={{ fontWeight: '600' }}>
              ONLINE
            </Typography>
          </View>
        </View>

        <Input
          label={t('personal.settings.brandNameLabel')}
          value={brandName}
          onChangeText={brandName => {
            if (isPremium) {
              setBrandName(brandName);
            }
          }}
          placeholder="Ex: NeoStrength"
        />

        <Input
          label={t('personal.settings.logoUrlLabel')}
          value={logoUrl}
          onChangeText={logoUrl => {
            if (isPremium) {
              setLogoUrl(logoUrl);
            }
          }}
          placeholder="Ex: https://image.png"
        />

        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <Input
              label={t('personal.settings.primaryColorLabel')}
              value={primaryColor}
              onChangeText={primaryColor => {
                if (isPremium) {
                  setPrimaryColor(primaryColor);
                }
              }}
              maxLength={7}
            />
          </View>
          <View style={[styles.flexHalf, styles.gapLeft]}>
            <Input
              label="Cor Secundária (HEX)"
              value={secondaryColor}
              onChangeText={secondaryColor => {
                if (isPremium) {
                  setSecondaryColor(secondaryColor);
                }
              }}
              maxLength={7}
            />
          </View>
        </View>

        <Button
          title={t('personal.settings.saveColorsBtn')}
          loading={loadingBranding}
          onPress={handleUpdateBranding}
          style={{ marginTop: 12 }}
        />
      </Card>

      {/* Plan Card Subscription */}
      <Typography variant="h2" style={styles.planSectionTitle}>
        {t('personal.settings.subscriptionPlans', 'Planos de Assinatura')}
      </Typography>

      <PlanCard
        name="Plano Mensal"
        price="R$ 49,90"
        features={[
          'Alunos ilimitados',
          'Montagem de treinos personalizada',
          'Suporte prioritário',
          'Design white-label completo',
        ]}
      />

      <PlanCard
        name="Plano Semestral"
        price="R$ 239,40"
        features={[
          '20% de economia mensal',
          'Alunos ilimitados',
          'Painel de evolução completo',
          'Customizações avançadas de logo',
        ]}
      />

      {/* Logout */}
      <Button
        title={t('personal.settings.logoutBtn')}
        variant="ghost"
        onPress={handleLogout}
        style={styles.logoutBtn}
      >
        <View style={styles.logoutContent}>
          <LogOut size={16} color={theme.danger} style={{ marginRight: 6 }} />
          <Typography variant="bold" colorType="danger">
            {t('personal.settings.logoutBtn')}
          </Typography>
        </View>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  roleBadgeContainer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  roleText: {
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 0,
  },
  sectionSubtitle: {
    marginBottom: 16,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetCard: {
    width: '48%',
    aspectRatio: 1.1,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInsideColor: {
    alignSelf: 'center',
  },
  presetName: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 1,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  previewStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  flexHalf: {
    flex: 1,
  },
  gapLeft: {
    marginLeft: 12,
  },
  planSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
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
  themeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
