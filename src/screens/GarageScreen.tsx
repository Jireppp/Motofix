import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, Modal, Image,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, LABEL_STYLE, FONT_FAMILY, SHADOWS } from '../constants/theme';
import { getBrandImage, THEME_ICONS } from '../constants/assets';
import { UserVehicle, MasterBrand } from '../types';
import { vehicleService } from '../services/vehicleService';
import { HelpCircle, Edit2, Plus, X, Sun, Moon, Monitor, ChevronRight } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

// Hallmark - genre: modern-minimal - macrostructure: Index-First - design-system: none - designed-as-app
// Structural fingerprint: Inline heading, Full-bleed rows, Hairline dividers, Typographic-only buttons

interface GarageScreenProps {
  onSelectVehicle: (vehicle: UserVehicle) => void;
  onAddVehicle: () => void;
  onHelp: () => void;
  refreshKey: number;
}

export default function GarageScreen({ onSelectVehicle, onAddVehicle, onHelp, refreshKey }: GarageScreenProps) {
  const { colors: COLORS, mode, setMode } = useTheme();
  const styles = getStyles(COLORS);

  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editVehicle, setEditVehicle] = useState<UserVehicle | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editBrandId, setEditBrandId] = useState('');
  const [brands, setBrands] = useState<MasterBrand[]>([]);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { loadVehicles(); }, [refreshKey]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch { Alert.alert('Error', 'Failed to load vehicle data.'); }
    finally { setLoading(false); }
  };

  const openEditModal = async (vehicle: UserVehicle) => {
    haptic.light();
    setEditVehicle(vehicle);
    setEditName(vehicle.vehicle_name);
    setEditPlate(vehicle.plate_number || '');
    setEditBrandId(vehicle.brand_id);
    if (brands.length === 0) {
      try { const b = await vehicleService.getBrands(); setBrands(b); } catch { }
    }
  };

  const handleSaveEdit = async () => {
    if (!editVehicle) return;
    if (!editName.trim()) { haptic.warning(); Alert.alert('Error', 'Please enter vehicle name.'); return; }
    if (!editBrandId) { haptic.warning(); Alert.alert('Error', 'Please select vehicle manufacturer.'); return; }
    setSavingEdit(true);
    try {
      await vehicleService.updateVehicle(editVehicle.id, editBrandId, editName.trim(), editPlate.trim());
      haptic.success();
      setEditVehicle(null);
      loadVehicles();
    } catch {
      haptic.warning();
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteVehicle = (vehicle: UserVehicle) => {
    haptic.warning();
    Alert.alert('Delete Vehicle', 'Are you sure you want to delete this vehicle? All tracked parts and service logs will be permanently deleted.',
      [{ text: 'Cancel', style: 'cancel' }, {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await vehicleService.deleteVehicle(vehicle.id);
            haptic.success();
            loadVehicles();
          } catch {
            haptic.warning();
            Alert.alert('Error', 'Failed to delete vehicle.');
          }
        },
      }]
    );
  };

  const selectedBrand = brands.find((b) => b.id === editBrandId);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const renderVehicleRow = ({ item }: { item: UserVehicle }) => {
    return (
      <TouchableOpacity
        style={styles.indexRow}
        onPress={() => {
          haptic.light();
          onSelectVehicle(item);
        }}
        activeOpacity={0.6}
      >
        <View style={styles.irBrandCol}>
          <Image
            source={getBrandImage(item.master_brand?.image_url || 'default', true)}
            style={styles.irBrandImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.irMainCol}>
          <Text style={styles.irName} numberOfLines={1}>{item.vehicle_name}</Text>
          <Text style={styles.irPlate}>{item.plate_number || 'NO PLATE'}</Text>
        </View>
        <View style={styles.irOdoCol}>
          <Text style={styles.irOdo}>{(item.current_km ?? 0).toLocaleString()} km</Text>
        </View>
        <View style={styles.irActionCol}>
          <TouchableOpacity onPress={() => openEditModal(item)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Edit2 size={16} color={COLORS.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Index Header */}
      <View style={styles.indexHeader}>
        <Text style={styles.indexTitle}>Garage // Vehicles</Text>
        <View style={styles.ihActions}>
          <TouchableOpacity
            onPress={() => {
              haptic.selection();
              setShowThemePicker(true);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Sun size={18} color={COLORS.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              haptic.light();
              onHelp();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ marginLeft: 16 }}
          >
            <HelpCircle size={18} color={COLORS.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Table Headers */}
      {vehicles.length > 0 && (
        <View style={styles.tableHead}>
          <Text style={[styles.thText, { width: 40 }]}></Text>
          <Text style={[styles.thText, { flex: 1 }]}>UNIT / PLATE</Text>
          <Text style={[styles.thText, { width: 80, textAlign: 'right' }]}>ODOMETER</Text>
          <Text style={[styles.thText, { width: 40 }]}></Text>
        </View>
      )}

      {/* Vehicle List */}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderVehicleRow}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addInlineRow}
            onPress={() => {
              haptic.light();
              onAddVehicle();
            }}
          >
            <Plus size={16} color={COLORS.textSecondary} strokeWidth={2} />
            <Text style={styles.addInlineText}>Register new vehicle</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>0 records found.</Text>
            <Text style={styles.emptySubtitle}>No vehicles registered in the current index.</Text>
          </View>
        }
      />

      {/* ─── Edit Modal ─── */}
      <Modal visible={editVehicle !== null} transparent animationType="fade" onRequestClose={() => setEditVehicle(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>[ Edit Record ]</Text>
              <TouchableOpacity onPress={() => setEditVehicle(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <X size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.formLabel}>IDENTIFIER</Text>
              <TextInput style={styles.inputMinimal} value={editName} onChangeText={setEditName}
                placeholder="Vehicle name" placeholderTextColor={COLORS.textTertiary} maxLength={50} />

              <Text style={styles.formLabel}>MANUFACTURER</Text>
              <TouchableOpacity style={styles.inputMinimal} onPress={() => setShowBrandPicker(true)}>
                {selectedBrand ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={getBrandImage(selectedBrand.image_url, true)} style={{ width: 16, height: 16, marginRight: 8 }} resizeMode="contain" />
                    <Text style={{ color: COLORS.textPrimary, fontFamily: FONT_FAMILY.mono }}>{selectedBrand.brand_name.toUpperCase()}</Text>
                  </View>
                ) : (
                  <Text style={{ color: COLORS.textTertiary, fontFamily: FONT_FAMILY.mono }}>Select...</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.formLabel}>REGISTRATION</Text>
              <TextInput style={styles.inputMinimal} value={editPlate} onChangeText={setEditPlate}
                placeholder="Plate number" placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="characters" maxLength={15} />

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => { setEditVehicle(null); if (editVehicle) handleDeleteVehicle(editVehicle); }}>
                  <Text style={styles.btnDangerText}>[ Delete ]</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.btnPrimaryText}>[ Save Changes ]</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Brand Picker */}
      <Modal visible={showBrandPicker} transparent animationType="fade" onRequestClose={() => setShowBrandPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>[ Select Manufacturer ]</Text>
              <TouchableOpacity onPress={() => setShowBrandPicker(false)}>
                <X size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <FlatList data={brands} keyExtractor={(item) => item.id} renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => { setEditBrandId(item.id); setShowBrandPicker(false); }}
              >
                <Image source={getBrandImage(item.image_url, true)} style={{ width: 16, height: 16, marginRight: 12 }} resizeMode="contain" />
                <Text style={styles.pickerRowText}>{item.brand_name.toUpperCase()}</Text>
              </TouchableOpacity>
            )} />
          </View>
        </View>
      </Modal>

      {/* Theme Picker */}
      <Modal visible={showThemePicker} transparent animationType="fade" onRequestClose={() => setShowThemePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>[ Theme Settings ]</Text>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <X size={20} color={COLORS.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 24, paddingBottom: 8 }}>
              <TouchableOpacity style={styles.themeOptionBtn} onPress={() => { setMode('system'); setShowThemePicker(false); }}>
                <Text style={[styles.themeOptionText, mode === 'system' && styles.themeOptionTextActive]}>System Match</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.themeOptionBtn} onPress={() => { setMode('light'); setShowThemePicker(false); }}>
                <Text style={[styles.themeOptionText, mode === 'light' && styles.themeOptionTextActive]}>Light Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.themeOptionBtn} onPress={() => { setMode('dark'); setShowThemePicker(false); }}>
                <Text style={[styles.themeOptionText, mode === 'dark' && styles.themeOptionTextActive]}>Dark Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

  indexHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24,
  },
  indexTitle: { fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  ihActions: { flexDirection: 'row', alignItems: 'center' },

  tableHead: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  thText: { fontFamily: FONT_FAMILY.mono, fontSize: 10, color: COLORS.textTertiary, letterSpacing: 1 },

  listContent: { paddingBottom: 120 },

  indexRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  irBrandCol: { width: 40, justifyContent: 'center' },
  irBrandImg: { width: 24, height: 24, opacity: 0.8 },
  irMainCol: { flex: 1, paddingRight: 16 },
  irName: { fontFamily: FONT_FAMILY.display, fontSize: 16, color: COLORS.textPrimary, marginBottom: 2 },
  irPlate: { fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textSecondary },
  irOdoCol: { width: 80, alignItems: 'flex-end', justifyContent: 'center' },
  irOdo: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textPrimary },
  irActionCol: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },

  addInlineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 24, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  addInlineText: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary },

  emptyState: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textTertiary, marginBottom: 8 },
  emptySubtitle: { fontFamily: FONT_FAMILY.mono, fontSize: 12, color: COLORS.textTertiary, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textPrimary },
  modalBody: { padding: 24 },
  formLabel: { fontFamily: FONT_FAMILY.mono, fontSize: 10, letterSpacing: 1, color: COLORS.textTertiary, marginBottom: 8, marginTop: 16 },
  inputMinimal: {
    fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: 8, paddingHorizontal: 0,
  },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 24, borderTopWidth: 1, borderTopColor: COLORS.border },
  btnPrimaryText: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.primary },
  btnDangerText: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.danger },

  pickerRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerRowText: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textPrimary },
  themeOptionBtn: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  themeOptionText: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary },
  themeOptionTextActive: { color: COLORS.primary, fontFamily: FONT_FAMILY.monoBold },
});
