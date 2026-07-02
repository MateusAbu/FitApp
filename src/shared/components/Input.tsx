import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const borderStyle = {
    borderColor: error
      ? theme.danger || '#EF4444'
      : isFocused
      ? theme.primaryColor
      : theme.border || 'rgba(255,255,255,0.06)',
    backgroundColor: theme.surfaceLo || '#0F1116',
    color: theme.text || '#F4F2EC',
  };

  return (
    <View style={styles.container}>
      {label && (
        <Typography
          variant="bold"
          style={[styles.label, { color: theme.textDim || '#9097A4' }]}
        >
          {label}
        </Typography>
      )}
      <TextInput
        style={[styles.input, borderStyle, style]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={theme.textMuted || '#5A6070'}
        keyboardAppearance="dark"
        {...props}
      />
      {error && (
        <Typography
          variant="caption"
          style={[styles.errorText, { color: theme.danger || '#EF4444' }]}
        >
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  errorText: {
    marginTop: 4,
  },
});
