import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption' | 'bold' | 'mono';
  colorType?: 'text' | 'textDim' | 'textMuted' | 'primary' | 'secondary' | 'success' | 'warn' | 'danger' | 'light';
  children: React.ReactNode;
}

export function Typography({
  variant = 'body',
  colorType = 'text',
  children,
  style,
  ...props
}: TypographyProps) {
  const theme = useTheme();

  const colorStyles = {
    text: { color: theme.text || theme.textColor },
    textDim: { color: theme.textDim || '#9097A4' },
    textMuted: { color: theme.textMuted || '#5A6070' },
    primary: { color: theme.primaryColor },
    secondary: { color: theme.secondaryColor },
    success: { color: theme.success || '#5BD37C' },
    warn: { color: theme.warn || '#F4B23B' },
    danger: { color: theme.danger || '#F4625C' },
    light: { color: theme.textDim || '#9CA3AF' },
  };

  const textStyle = [
    styles[variant],
    colorStyles[colorType],
    // Se for variante mono, aplica a família monospace
    variant === 'mono' && { fontFamily: 'Courier' }, // Fallback para React Native
    style,
  ];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 6,
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 12,
  },
  mono: {
    fontSize: 14,
    fontWeight: '500',
  },
});
