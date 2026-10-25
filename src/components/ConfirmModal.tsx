import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from '../constants/theme';
import { X, AlertTriangle } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

// Themed replacement for the native Alert.alert destructive confirmation.

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const accent = destructive ? COLORS.danger : COLORS.textPrimary;

  const handleCancel = () => {
    haptic.light();
    onCancel();
  };

  const handleConfirm = () => {
    haptic.medium();
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              {destructive && <AlertTriangle size={16} color={COLORS.danger} strokeWidth={2} />}
              <Text style={[styles.title, destructive && { color: COLORS.danger }]} numberOfLines={2}>
                {title}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={COLORS.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.actions}>
              <TouchableOpacity onPress={handleCancel} style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>{cancelLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: accent }]}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnPrimaryText, destructive && { color: '#FFFFFF' }]}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  titleRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 16,
  },
  title: {
    flexShrink: 1,
    fontFamily: FONT_FAMILY.mono,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  modalBody: {
    padding: 24,
  },
  message: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 24,
    marginTop: 32,
  },
  btnCancel: {
    paddingVertical: 12,
  },
  btnCancelText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  btnPrimary: {
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: 14,
    color: COLORS.bg,
    letterSpacing: 0.5,
  },
});
