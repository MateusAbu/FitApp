import React from 'react';
import { Modal as RNModal, ModalProps as RNModalProps, View, StyleSheet, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Typography } from './Typography';
import { useTheme } from '../../providers/ThemeProvider';
import { useThemeStore } from '../../store/useThemeStore';

interface ModalProps extends RNModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  ...props
}: ModalProps) {
  const theme = useTheme();
  const isDark = useThemeStore((state) => state.isDarkMode);

  const bgColor = isDark ? '#13151B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const textColor = isDark ? '#F4F2EC' : '#1A1C20';

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { backgroundColor: bgColor }]}>
              <View style={[styles.header, { borderBottomColor: borderColor }]}>
                <Typography variant="h2" style={[styles.headerTitle, { color: textColor }]}>
                  {title || ''}
                </Typography>
                <TouchableWithoutFeedback onPress={onClose}>
                  <View style={styles.closeButton}>
                    <X size={20} color={textColor} />
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <ScrollView contentContainerStyle={styles.body} bounces={false}>
                {children}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    marginBottom: 0,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
});
