import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { Typography } from '../../shared/components/Typography';
import { validateEmail, validatePassword } from '../../shared/utils/validators';
import { useTheme } from '../../providers/ThemeProvider';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();
  const theme = useTheme();

  const handleLogin = async () => {
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setErrors({ 
        email: emailErr ? t(emailErr) : undefined, 
        password: passErr ? t(passErr) : undefined 
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (e: any) {
      Alert.alert(t('auth.loginErrorTitle', 'Erro ao entrar'), e.message || t('auth.loginErrorDesc', 'Verifique suas credenciais.'));
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
          {theme.brandName || 'FitApp'}
        </Typography>
        <Typography variant="body" colorType="textDim">
          {t('auth.loginSubtitle', 'Gerenciamento completo para Personal e Alunos')}
        </Typography>
      </View>

      <View style={styles.form}>
        <Input
          label={t('auth.emailLabel')}
          placeholder={t('auth.emailPlaceholder', 'seuemail@exemplo.com')}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />

        <Input
          label={t('auth.passwordLabel')}
          placeholder={t('auth.passwordPlaceholder', 'Sua senha secreta')}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <Button
          title={t('auth.loginBtn')}
          loading={loading}
          onPress={handleLogin}
          style={styles.button}
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkContainer}>
          <Typography variant="bold" colorType="primary">
            {t('auth.registerLink')}
          </Typography>
        </TouchableOpacity>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 16,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
  },
});
