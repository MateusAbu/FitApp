import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore, themePalettes } from '../../store/useThemeStore';
import { supabase } from '../../services/supabase';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { Typography } from '../../shared/components/Typography';
import { useTheme } from '../../providers/ThemeProvider';

export default function Onboarding() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { setTheme } = useThemeStore();
  const theme = useTheme();
  const router = useRouter();

  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor);
  const [loading, setLoading] = useState(false);

  const applyPalette = (palette: typeof themePalettes.forge) => {
    setBrandName(palette.brandName);
    setPrimaryColor(palette.primaryColor);
    setSecondaryColor(palette.secondaryColor);
  };

  const handleSaveOnboarding = async () => {
    if (!brandName) {
      Alert.alert(t('common.error', 'Erro'), t('personal.settings.errorBrandName', 'Por favor, digite o nome da sua marca.'));
      return;
    }

    if (!profile?.id) return;

    setLoading(true);

    try {
      const themeData = {
        personal_id: profile.id,
        brand_name: brandName,
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        background_color: theme.bg,
        text_color: theme.text,
      };

      const { error } = await supabase
        .from('personal_themes')
        .upsert(themeData);

      if (error) throw error;

      // Sincroniza o tema dinamicamente na store global
      setTheme({
        brandName,
        logoUrl: logoUrl || null,
        primaryColor,
        secondaryColor,
      });

      Alert.alert(t('common.success', 'Sucesso'), t('personal.settings.brandingSuccess', 'Marca cadastrada com sucesso!'));
      router.replace('/(personal)/dashboard');
    } catch (e: any) {
      Alert.alert(t('personal.settings.brandingError', 'Erro ao salvar branding'), e.message || t('common.error', 'Erro inesperado.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Typography variant="h1" colorType="primary" style={styles.title}>
          {t('personal.settings.brandingTitle', 'Identidade da Marca')}
        </Typography>
        <Typography variant="body" colorType="textDim" style={styles.subtitle}>
          {t('personal.settings.brandingSubtitle', 'Configure a marca e cores que os seus alunos visualizarão no app.')}
        </Typography>
      </View>

      <View style={styles.form}>
        <Input
          label={t('personal.settings.brandNameLabel', 'Nome da Sua Marca / Assessoria')}
          placeholder={t('personal.settings.brandNamePlaceholder', 'Ex: Fitness Pro Studio')}
          value={brandName}
          onChangeText={setBrandName}
        />

        <Input
          label={t('personal.settings.logoUrlLabel', 'Link da Imagem do Logo (Opcional)')}
          placeholder="https://suaimagem.com/logo.png"
          value={logoUrl}
          onChangeText={setLogoUrl}
        />

        <Typography variant="h2" style={styles.sectionTitle}>
          {t('personal.settings.presetsTitle', 'Paletas de Cores White-Label')}
        </Typography>

        <View style={styles.paletteGrid}>
          {(Object.keys(themePalettes) as Array<keyof typeof themePalettes>).map((key) => {
            const palette = themePalettes[key];
            const active = primaryColor === palette.primaryColor;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.paletteCard, 
                  { 
                    backgroundColor: theme.surface, 
                    borderColor: active ? theme.primaryColor : theme.border 
                  }
                ]}
                onPress={() => applyPalette(palette)}
              >
                <View style={styles.colorIndicatorRow}>
                  <View style={[styles.colorBubble, { backgroundColor: palette.primaryColor }]} />
                  <View style={[styles.colorBubble, { backgroundColor: palette.secondaryColor }]} />
                </View>
                <Typography variant="caption" style={{ fontWeight: '600' }}>
                  {palette.brandName}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        <Typography variant="h2" style={styles.sectionTitle}>
          {t('personal.settings.customHEX', 'Ajustes Customizados (HEX)')}
        </Typography>

        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <Input
              label={t('personal.settings.primaryColorLabel', 'Cor Primária')}
              value={primaryColor}
              onChangeText={setPrimaryColor}
              maxLength={7}
            />
          </View>
          <View style={[styles.flexHalf, styles.gapLeft]}>
            <Input
              label={t('personal.settings.secondaryColorLabel', 'Cor Secundária')}
              value={secondaryColor}
              onChangeText={setSecondaryColor}
              maxLength={7}
            />
          </View>
        </View>

        <Button
          title={t('personal.settings.saveAndContinue', 'Salvar e Continuar')}
          loading={loading}
          onPress={handleSaveOnboarding}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  paletteCard: {
    width: '48%',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  colorIndicatorRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  colorBubble: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 3,
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
  button: {
    marginTop: 24,
  },
});
