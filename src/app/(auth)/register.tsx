import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { Typography } from '../../shared/components/Typography';
import { validateEmail, validatePasswordStrength, validatePasswordMatch, validateInviteCode, PASSWORD_RULES } from '../../shared/utils/validators';
import { useTheme } from '../../providers/ThemeProvider';

const PASSWORD_RULE_LABELS: Record<string, string> = {
  length: 'Mínimo de 8 caracteres',
  upper: 'Uma letra maiúscula',
  number: 'Um número',
  special: 'Um caractere especial (!@#$...)',
};

function PasswordChecklist({ password }: { password: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.checklist}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        const color = met ? theme.primaryColor : theme.textMuted || '#5A6070';
        return (
          <View key={rule.key} style={styles.checklistRow}>
            <View
              style={[
                styles.checklistDot,
                { borderColor: color, backgroundColor: met ? color : 'transparent' },
              ]}
            />
            <Typography variant="caption" style={{ color }}>
              {t(`auth.pwRule.${rule.key}`, PASSWORD_RULE_LABELS[rule.key])}
            </Typography>
          </View>
        );
      })}
    </View>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'personal' | 'student'>('personal');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; inviteCode?: string }>({});
  const router = useRouter();
  const theme = useTheme();

  const handleRegister = async () => {
    const emailErr = validateEmail(email);
    const passErr = validatePasswordStrength(password);
    const confirmErr = validatePasswordMatch(password, confirmPassword);
    const codeErr = role === 'student' ? validateInviteCode(inviteCode) : undefined;

    if (emailErr || passErr || confirmErr || codeErr) {
      setErrors({
        email: emailErr ? t(emailErr) : undefined,
        password: passErr ? t(passErr) : undefined,
        confirmPassword: confirmErr ? t(confirmErr) : undefined,
        inviteCode: codeErr ? t(codeErr) : undefined
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // O perfil é criado no banco pelo trigger handle_new_user, que lê estes
      // metadados e resolve o convite/código do Personal do lado do servidor.
      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName || '',
            invite_code: role === 'student' ? inviteCode.trim().toUpperCase() : '',
          },
        },
      });

      if (signUpErr) throw signUpErr;
      if (!authData.user) throw new Error(t('auth.registerErrorNoUser', 'Não foi possível cadastrar a conta.'));

      // Com "Confirm email" desligado, a sessão já vem no signUp e o _layout
      // redireciona o usuário conforme o role assim que o perfil é carregado.
      Alert.alert(t('common.success', 'Sucesso'), t('auth.registerSuccess', 'Cadastro realizado com sucesso!'));
    } catch (e: any) {
      Alert.alert(t('auth.registerErrorTitle', 'Erro no cadastro'), e.message || t('common.error', 'Ocorreu um erro inesperado.'));
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
          placeholder={t('auth.passwordStrengthPlaceholder', 'Crie uma senha forte')}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <PasswordChecklist password={password} />

        <Input
          label={t('auth.confirmPasswordLabel', 'Confirmar senha')}
          placeholder={t('auth.confirmPasswordPlaceholder', 'Digite a senha novamente')}
          secureTextEntry
          autoCapitalize="none"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
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
  checklist: {
    marginTop: 4,
    marginBottom: 12,
    gap: 6,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checklistDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
});
