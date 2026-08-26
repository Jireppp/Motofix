import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList, Image
} from 'react-native';
import { COLORS, FONT_FAMILY } from '../constants/theme';
import { MasterBrand } from '../types';
import { vehicleService } from '../services/vehicleService';
import { getBrandImage } from '../constants/assets';
import { ChevronLeft, X, AlertTriangle } from 'lucide-react-native';

// Hallmark - genre: modern-minimal - macrostructure: Form-Driven - design-system: none - designed-as-app
// Structural fingerprint: Centered heading, Single column, Negative space dividers, Sleek underlines

interface AddVehicleScreenProps {
  onGoBack: () => void;
  onSuccess: () => void;
}

export default function AddVehicleScreen({ onGoBack, onSuccess }: AddVehicleScreenProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [brands, setBrands] = useState<MasterBrand[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedBrand, setSelectedBrand] = useState<MasterBrand | null>(null);
  const [vehicleName, setVehicleName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [initialKm, setInitialKm] = useState('');

  // UI State
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await vehicleService.getBrands();
      setBrands(data);
    } catch {
      setSubmitError('Failed to load brands.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter((b) => b.brand_name.toLowerCase().includes(brandSearch.toLowerCase()));

  const isFormValid = selectedBrand && vehicleName.trim() && initialKm.trim();

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!isFormValid) return;

    const km = parseInt(initialKm);
    if (isNaN(km) || km < 0) {
      setSubmitError('Invalid odometer value.');
      return;
    }

    setSaving(true);
    try {
      await vehicleService.addVehicle(selectedBrand.id, vehicleName.trim(), km, plateNumber.trim());
      onSuccess();
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to add vehicle.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      
      <View style={styles.topNav}>
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={styles.navLink}>Cancel</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.navTitle}>ADD VEHICLE</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.formBlock}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>MANUFACTURER</Text>
            <TouchableOpacity style={styles.inputMinimal} onPress={() => setShowBrandPicker(true)}>
              {selectedBrand ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={getBrandImage(selectedBrand.image_url, true)} style={{ width: 20, height: 20, marginRight: 12 }} resizeMode="contain" />
                  <Text style={{ color: COLORS.textPrimary, fontFamily: FONT_FAMILY.mono, fontSize: 16 }}>{selectedBrand.brand_name.toUpperCase()}</Text>
                </View>
              ) : (
                <Text style={{ color: COLORS.textTertiary, fontFamily: FONT_FAMILY.mono, fontSize: 16 }}>Select brand...</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>VEHICLE NAME</Text>
            <TextInput
              style={styles.inputUnderline}
              placeholder="e.g. Daily Commuter"
              placeholderTextColor={COLORS.textTertiary}
              value={vehicleName}
              onChangeText={setVehicleName}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REGISTRATION PLATE</Text>
            <TextInput
              style={[styles.inputUnderline, { textTransform: 'uppercase' }]}
              placeholder="e.g. B 1234 ABC"
              placeholderTextColor={COLORS.textTertiary}
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
              maxLength={15}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CURRENT ODOMETER (KM)</Text>
            <TextInput
              style={styles.inputUnderline}
              placeholder="e.g. 15000"
              placeholderTextColor={COLORS.textTertiary}
              value={initialKm}
              onChangeText={setInitialKm}
              keyboardType="numeric"
            />
          </View>

          {submitError && (
            <Text style={styles.errorText}>{submitError}</Text>
          )}

        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.pillBtn, (!isFormValid || saving) && { opacity: 0.5 }]} 
          onPress={handleSubmit} 
          disabled={!isFormValid || saving}
        >
          {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.pillBtnText}>Register Vehicle</Text>}
        </TouchableOpacity>
      </View>

      {/* Brand Picker Modal (Minimalist Redesign) */}
      <Modal visible={showBrandPicker} transparent animationType="fade" onRequestClose={() => { setShowBrandPicker(false); setBrandSearch(''); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>[ Select Manufacturer ]</Text>
              <TouchableOpacity onPress={() => { setShowBrandPicker(false); setBrandSearch(''); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <X size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBlock}>
              <TextInput
                style={styles.searchUnderline}
                placeholder="Search..."
                placeholderTextColor={COLORS.textTertiary}
                value={brandSearch}
                onChangeText={setBrandSearch}
                autoCorrect={false}
              />
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 40 }} />
            ) : (
              <FlatList data={filteredBrands} keyExtractor={(item) => item.id} renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => { setSelectedBrand(item); setShowBrandPicker(false); setBrandSearch(''); }}
                >
                  <Image source={getBrandImage(item.image_url, true)} style={{ width: 16, height: 16, marginRight: 12 }} resizeMode="contain" />
                  <Text style={styles.pickerRowText}>{item.brand_name.toUpperCase()}</Text>
                </TouchableOpacity>
              )} />
            )}
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  topNav: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16,
  },
  navLink: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary },
  navTitle: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textPrimary, letterSpacing: 1 },

  scrollBody: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  formBlock: {
    paddingTop: 48, paddingBottom: 40,
  },
  inputGroup: {
    paddingHorizontal: 24, marginBottom: 40,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 12
  },
  inputUnderline: {
    fontFamily: FONT_FAMILY.mono, fontSize: 18, color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 0,
  },
  inputMinimal: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 0,
  },

  errorText: {
    fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.danger, marginTop: 8, paddingHorizontal: 24
  },

  bottomBar: {
    padding: 24, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg
  },
  pillBtn: {
    backgroundColor: COLORS.textPrimary, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center'
  },
  pillBtnText: {
    fontFamily: FONT_FAMILY.bodyBold, fontSize: 14, color: COLORS.bg, letterSpacing: 0.5
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 0, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textPrimary },
  searchBlock: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  searchUnderline: {
    fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 0,
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerRowText: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textPrimary },
});
