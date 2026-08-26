import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from '../constants/theme';
import { X } from 'lucide-react-native';

// Hallmark - genre: modern-minimal - macrostructure: Form-Driven - design-system: none - designed-as-app
// Structural fingerprint: Negative space modal, Sleek underlines, Pill buttons

interface ReplacementModalProps {
  visible: boolean;
  sparepartName: string;
  onConfirm: (brandName: string, cost: number) => Promise<void>;
  onCancel: () => void;
}

export default function ReplacementModal({
  visible,
  sparepartName,
  onConfirm,
  onCancel,
}: ReplacementModalProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [brandName, setBrandName] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!brandName.trim()) {
      setError('Masukkan merek sparepart pengganti.');
      return;
    }
    if (brandName.length > 50) {
      setError('Merek sparepart maksimal 50 karakter.');
      return;
    }

    const parsedCost = parseInt(cost.replace(/\D/g, ''), 10) || 0;

    setLoading(true);
    setError(null);
    try {
      await onConfirm(brandName.trim(), parsedCost);
      setBrandName('');
      setCost('');
    } catch (err) {
      setError('Gagal menyimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setBrandName('');
    setCost('');
    setError(null);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          
          <View style={styles.modalHeader}>
            <Text style={styles.title}>[ Log Replacement ]</Text>
            <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={COLORS.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.subtitle}>
              Recording replacement for <Text style={{ fontFamily: FONT_FAMILY.bodyBold, color: COLORS.textPrimary }}>{sparepartName}</Text>
            </Text>

            <Text style={styles.formLabel}>NEW PART BRAND</Text>
            <TextInput
              style={[styles.inputUnderline, error && { borderBottomColor: COLORS.danger }]}
              placeholder="e.g. Federal, Aspira, NGK"
              placeholderTextColor={COLORS.textTertiary}
              value={brandName}
              onChangeText={(text) => {
                setBrandName(text);
                setError(null);
              }}
              maxLength={50}
              autoFocus
            />

            <Text style={styles.formLabel}>ESTIMATED COST (OPTIONAL)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT_FAMILY.mono, fontSize: 18, color: COLORS.textTertiary, marginRight: 8, marginTop: 4 }}>Rp</Text>
              <TextInput
                style={[styles.inputUnderline, { flex: 1 }]}
                placeholder="150000"
                placeholderTextColor={COLORS.textTertiary}
                value={cost}
                onChangeText={(text) => setCost(text.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity onPress={handleCancel} style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.bg} size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Confirm</Text>
                )}
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
  title: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  modalBody: {
    padding: 24,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  formLabel: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  inputUnderline: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 18,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  errorText: {
    color: COLORS.danger,
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    marginTop: -12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 24,
    marginTop: 24,
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
    backgroundColor: COLORS.textPrimary,
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 32,
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
