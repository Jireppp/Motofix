import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Switch
} from 'react-native';
import { COLORS, FONT_FAMILY } from '../constants/theme';
import { UserVehicle, MasterSparepart, MasterCategory } from '../types';
import { sparepartService } from '../services/sparepartService';
import { Wrench, Droplet, Zap, Wind, CircleDashed, ChevronLeft, Plus } from 'lucide-react-native';

// Hallmark - genre: modern-minimal - macrostructure: Form-Driven - design-system: none - designed-as-app
// Structural fingerprint: Centered heading, Single column, Negative space dividers, Sleek underlines

interface AddSparepartScreenProps {
  vehicle: UserVehicle;
  onGoBack: () => void;
  onSuccess: () => void;
}

export default function AddSparepartScreen({ vehicle, onGoBack, onSuccess }: AddSparepartScreenProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ category: string, items: any[] }[]>([]);

  // Selection state
  const [selected, setSelected] = useState<any | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Form State
  const [customName, setCustomName] = useState('');
  const [interval, setInterval] = useState('');
  
  // Legacy / existing part state
  const [isLegacy, setIsLegacy] = useState(false);
  const [legacyKm, setLegacyKm] = useState('');
  const [legacyError, setLegacyError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const data = await sparepartService.getMasterData();
      
      const grouped = data.reduce((acc: any, item) => {
        const catName = item.category || 'LAINNYA';
        if (!acc[catName]) {
          acc[catName] = { category: catName, items: [] };
        }
        acc[catName].items.push(item);
        return acc;
      }, {});

      setCategories(Object.values(grouped));
    } catch {
      setSubmitError('Failed to load master parts data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMaster = (item: any) => {
    setSelected(item);
    setIsCustomMode(false);
    setInterval(item.default_interval.toString());
    setSubmitError(null);
  };

  const handleSelectCustom = () => {
    setSelected(null);
    setIsCustomMode(true);
    setCustomName('');
    setInterval('');
    setSubmitError(null);
  };

  const validateLegacy = (): number | null => {
    if (!isLegacy) return 0;
    if (!legacyKm.trim()) { setLegacyError('Required'); return null; }
    const km = parseInt(legacyKm);
    if (isNaN(km) || km < 0) { setLegacyError('Invalid number'); return null; }
    const intv = parseInt(interval);
    if (!isNaN(intv) && km > intv) { setLegacyError('Usage exceeds interval'); return null; }
    return km;
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    const usedKm = validateLegacy();
    if (usedKm === null) return;

    if (isCustomMode && !customName.trim()) {
      setSubmitError('Part name is required for custom parts.');
      return;
    }

    const intervalVal = parseInt(interval);
    if (isNaN(intervalVal) || intervalVal <= 0) {
      setSubmitError('A valid interval (e.g. 2000) is required.');
      return;
    }

    setSaving(true);
    try {
      const kmAtSetup = vehicle.current_km - usedKm;

      if (isCustomMode) {
        await sparepartService.addCustomSparepart(vehicle.id, customName.trim(), intervalVal, kmAtSetup);
      } else if (selected) {
        await sparepartService.addSparepart(vehicle.id, selected.id, intervalVal, kmAtSetup);
      }
      onSuccess();
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to save part configuration.');
      setSaving(false);
    }
  };

  const renderIcon = (name?: string) => {
    if (!name) return <Wrench size={18} color={COLORS.textPrimary} />;
    const n = name.toLowerCase();
    if (n.includes('oli') || n.includes('minyak') || n.includes('cairan')) return <Droplet size={18} color={COLORS.textPrimary} />;
    if (n.includes('busi') || n.includes('aki') || n.includes('lampu')) return <Zap size={18} color={COLORS.textPrimary} />;
    if (n.includes('filter')) return <Wind size={18} color={COLORS.textPrimary} />;
    if (n.includes('rantai') || n.includes('v-belt') || n.includes('ban')) return <CircleDashed size={18} color={COLORS.textPrimary} />;
    return <Wrench size={18} color={COLORS.textPrimary} />;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topNav}>
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={styles.navLink}>Cancel</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.navTitle}>ADD PART</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        
        {/* Context Target */}
        <View style={styles.targetBlock}>
          <Text style={styles.targetLabel}>TARGET UNIT</Text>
          <Text style={styles.targetName}>{vehicle.vehicle_name}</Text>
          <Text style={styles.targetOdo}>{vehicle.current_km.toLocaleString()} KM</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.selectionBlock}>
            <Text style={styles.sectionTitle}>SELECT COMPONENT</Text>

            {categories.map((group, idx) => (
              <View key={idx} style={styles.chipGroup}>
                {group.items.map(item => {
                  const isSelected = selected?.id === item.id;
                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleSelectMaster(item)}
                    >
                      <View style={{ opacity: isSelected ? 1 : 0.5, marginRight: 8 }}>
                        {renderIcon(item.sparepart_name)}
                      </View>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {item.sparepart_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <TouchableOpacity 
              style={[styles.chip, isCustomMode && styles.chipActive, { alignSelf: 'flex-start', marginTop: 8 }]}
              onPress={handleSelectCustom}
            >
              <Plus size={16} color={isCustomMode ? COLORS.bg : COLORS.textPrimary} style={{ marginRight: 8 }} />
              <Text style={[styles.chipText, isCustomMode && styles.chipTextActive]}>OTHER COMPONENT</Text>
            </TouchableOpacity>
          </View>
        )}

        {(selected || isCustomMode) && (
          <View style={styles.formBlock}>
            <Text style={styles.sectionTitle}>CONFIGURATION</Text>

            {isCustomMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>COMPONENT NAME</Text>
                <TextInput
                  style={styles.inputUnderline}
                  placeholder="e.g. Custom Suspension"
                  placeholderTextColor={COLORS.textTertiary}
                  value={customName}
                  onChangeText={setCustomName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LIFESPAN INTERVAL (KM)</Text>
              <TextInput
                style={styles.inputUnderline}
                placeholder="e.g. 2000"
                placeholderTextColor={COLORS.textTertiary}
                value={interval}
                onChangeText={setInterval}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.legacyToggleContainer}>
              <View style={{ flex: 1 }}>
                <Text style={styles.legacyToggleTitle}>PART ALREADY IN USE?</Text>
                <Text style={styles.legacyToggleDesc}>Enable if this is not a fresh replacement.</Text>
              </View>
              <Switch
                value={isLegacy}
                onValueChange={(v) => { setIsLegacy(v); setLegacyError(null); setLegacyKm(''); }}
                trackColor={{ false: COLORS.border, true: COLORS.textPrimary }}
                thumbColor={COLORS.bg}
              />
            </View>

            {isLegacy && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>USAGE SO FAR (KM)</Text>
                <TextInput
                  style={styles.inputUnderline}
                  placeholder="e.g. 500"
                  placeholderTextColor={COLORS.textTertiary}
                  value={legacyKm}
                  onChangeText={(v) => { setLegacyKm(v); setLegacyError(null); }}
                  keyboardType="numeric"
                />
                {legacyError && <Text style={styles.errorText}>{legacyError}</Text>}
              </View>
            )}

            {submitError && (
              <Text style={[styles.errorText, { marginTop: 16 }]}>{submitError}</Text>
            )}
          </View>
        )}

      </ScrollView>

      {(selected || isCustomMode) && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.pillBtn, saving && { opacity: 0.5 }]} 
            onPress={handleSubmit} 
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.pillBtnText}>Track Component</Text>}
          </TouchableOpacity>
        </View>
      )}
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

  targetBlock: {
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40,
    alignItems: 'center'
  },
  targetLabel: { fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 8 },
  targetName: { fontFamily: FONT_FAMILY.display, fontSize: 24, color: COLORS.textPrimary, marginBottom: 4 },
  targetOdo: { fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textSecondary },

  sectionTitle: {
    fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textTertiary, letterSpacing: 1.5,
    marginBottom: 24, paddingHorizontal: 24
  },

  selectionBlock: {
    paddingBottom: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  chipGroup: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 24, marginBottom: 12,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 100, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bg
  },
  chipActive: {
    backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary,
  },
  chipText: {
    fontFamily: FONT_FAMILY.mono, fontSize: 12, color: COLORS.textPrimary, letterSpacing: 0.5
  },
  chipTextActive: {
    color: COLORS.bg,
  },

  formBlock: {
    paddingTop: 40, paddingBottom: 40,
  },
  inputGroup: {
    paddingHorizontal: 24, marginBottom: 32,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8
  },
  inputUnderline: {
    fontFamily: FONT_FAMILY.mono, fontSize: 18, color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 0,
  },
  
  legacyToggleContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 32,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: 32, marginTop: 16
  },
  legacyToggleTitle: {
    fontFamily: FONT_FAMILY.mono, fontSize: 12, color: COLORS.textPrimary, letterSpacing: 0.5, marginBottom: 4
  },
  legacyToggleDesc: {
    fontFamily: FONT_FAMILY.body, fontSize: 13, color: COLORS.textTertiary
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
  }
});
