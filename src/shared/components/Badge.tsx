import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warn' | 'danger';
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warn' | 'danger';
  dot?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Badge({
  children,
  tone,
  variant,
  dot = false,
  style,
}: BadgeProps) {
  const theme = useTheme();

  // Support both 'tone' and 'variant' properties
  const activeTone = tone || variant || 'neutral';

  const toneStyles = {
    primary: {
      bg: theme.primarySoft || 'rgba(242, 106, 58, 0.14)',
      text: theme.primaryColor,
    },
    secondary: {
      bg: 'rgba(255, 255, 255, 0.04)',
      text: theme.secondaryColor,
    },
    neutral: {
      bg: theme.border || 'rgba(255, 255, 255, 0.06)',
      text: theme.textDim || '#9097A4',
    },
    success: {
      bg: 'rgba(91, 211, 124, 0.14)',
      text: theme.success || '#5BD37C',
    },
    warn: {
      bg: 'rgba(244, 178, 59, 0.14)',
      text: theme.warn || '#F4B23B',
    },
    danger: {
      bg: 'rgba(244, 98, 92, 0.14)',
      text: theme.danger || '#F4625C',
    },
  };

  const currentTone = toneStyles[activeTone] || toneStyles.neutral;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: currentTone.bg,
          borderColor: 'transparent',
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: currentTone.text },
          ]}
        />
      )}
      <Typography
        variant="caption"
        style={[
          styles.text,
          { color: currentTone.text },
        ]}
      >
        {children}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
