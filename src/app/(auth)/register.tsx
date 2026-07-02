import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { Typography } from '../../shared/components/Typography';
import { validateEmail, validatePassword, validateInviteCode } from '../../shared/utils/validators';
import { useTheme } from '../../providers/ThemeProvider';

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'personal' | 'student'>('personal');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; inviteCode?: string }>({});
  const router = useRouter();
  const theme = useTheme();

  const handleRegister = async () => {
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const codeErr = role === 'student' ? validateInviteCode(inviteCode) : undefined;

    if (emailErr || passErr || codeErr) {
      setErrors({ 
        email: emailErr ? t(emailErr) : undefined, 
        password: passErr ? t(passErr) : undefined, 
        inviteCode: codeErr ? t(codeErr) : undefined 
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      let personalId: string | null = null;
      if (role === 'student') {
        // Verifica se o código de convite confere com algum Personal
        const { data: inviteData, error: inviteErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('invite_code', inviteCode.trim().toUpperCase())
          .eq('role', 'personal')
          .maybeSingle();

        if (inviteErr || !inviteData) {
          Alert.alert(t('auth.inviteErrorTitle', 'Erro no Convite'), t('auth.inviteErrorDesc', 'Código de convite inválido ou expirado.'));
          setLoading(false);
          return;
        }
        personalId = inviteData.id;
      }

      // Registro da conta de autenticação
      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpErr) throw signUpErr;
      if (!authData.user) throw new Error(t('auth.registerErrorNoUser', 'Não foi possível cadastrar a conta.'));

      // Vincula os dados extras de perfil na tabela profiles
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          role,
          full_name: fullName || null,
          personal_id: personalId,
          invite_code: role === 'personal' ? generateRandomInviteCode() : null,
          adherence: role === 'student' ? 100 : null, // Novo aluno começa com 100%
          status: 'active',
        });

      if (profileErr) throw profileErr;

      Alert.alert(t('common.success', 'Sucesso'), t('auth.registerSuccess', 'Cadastro realizado com sucesso!'));

      if (role === 'personal') {
        router.push('/(auth)/onboarding');
      } else {
        router.replace('/(student)');
      }
    } catch (e: any) {
      Alert.alert(t('auth.registerErrorTitle', 'Erro no cadastro'), e.message || t('common.error', 'Ocorreu um erro inesperado.'));
    } finally {
      setLoading(false);
    }
  };

  const generateRandomInviteCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Typography variant="h1" colorType="primary" style={styles.title}>
          {t('auth.registerTitle')}
        </Typography>
        <Typography variant="body" colorType="textDim">
          {t('auth.registerSubtitle', 'Junte-se ao time e comece sua jornada fitness')}
        </Typography>
      </View>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            { 
              borderColor: role === 'personal' ? theme.primaryColor : theme.border,
              backgroundColor: role === 'personal' ? theme.primarySoft : theme.surface 
            },
          ]}
          onPress={() => setRole('personal')}
        >
          <Typography variant="bold" colorType={role === 'personal' ? 'primary' : 'textDim'}>
            {t('auth.personalRole')}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            { 
              borderColor: role === 'student' ? theme.primaryColor : theme.border,
              backgroundColor: role === 'student' ? theme.primarySoft : theme.surface 
            },
          ]}
          onPress={() => setRole('student')}
        >
          <Typography variant="bold" colorType={role === 'student' ? 'primary' : 'textDim'}>
            {t('auth.studentRole')}
          </Typography>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Input
          label={t('auth.fullNameLabel')}
          placeholder={t('auth.fullNamePlaceholder', 'Ex: João da Silva')}
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
        />

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
          placeholder={t('auth.passwordPlaceholder', 'Senha de 6 dígitos no mínimo')}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        {role === 'student' && (
          <Input
            label={t('auth.inviteCodeLabel', 'Código de Convite do Personal')}
            placeholder="EXEM12"
            autoCapitalize="characters"
            maxLength={6}
            value={inviteCode}
            onChangeText={setInviteCode}
            error={errors.inviteCode}
          />
        )}

        <Button
          title={t('auth.registerBtn')}
          loading={loading}
          onPress={handleRegister}
          style={styles.button}
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkContainer}>
          <Typography variant="bold" colorType="primary">
            {t('auth.loginLink')}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  roleButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
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
