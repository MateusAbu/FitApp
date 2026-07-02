import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  elevated?: boolean;
}

export function Card({ children, style, padding = 16, elevated = false, ...props }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.surfaceHi : theme.surface,
          borderColor: theme.border,
          padding,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    width: '100%',
  },
});
