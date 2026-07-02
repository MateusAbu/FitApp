import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.primaryColor,
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: theme.surfaceHi || '#1B1E27',
          borderColor: theme.border || 'rgba(255,255,255,0.06)',
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'soft':
        return {
          backgroundColor: theme.primarySoft || 'rgba(242, 106, 58, 0.14)',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'danger':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.danger || '#F4625C',
          borderWidth: 1,
        };
      case 'outline':
      default:
        return {
          backgroundColor: 'transparent',
          borderColor: theme.primaryColor,
          borderWidth: 1.5,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return theme.text || '#F4F2EC';
      case 'ghost':
        return theme.textDim || '#9097A4';
      case 'soft':
        return theme.primaryColor;
      case 'danger':
        return theme.danger || '#F4625C';
      case 'outline':
      default:
        return theme.primaryColor;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { height: 34, borderRadius: 10, paddingHorizontal: 12 };
      case 'lg':
        return { height: 52, borderRadius: 14, paddingHorizontal: 20 };
      case 'md':
      default:
        return { height: 44, borderRadius: 12, paddingHorizontal: 16 };
    }
  };

  const sizeStyle = getSizeStyles();
  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyle,
        getButtonStyles(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : children ? (
        children
      ) : (
        <Typography
          variant="bold"
          style={{
            color: textColor,
            fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14,
          }}
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});
