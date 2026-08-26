import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, LABEL_STYLE, FONT_FAMILY, SHADOWS } from '../constants/theme';
import { UserVehicle, SparepartWithDetails } from '../types';
import { vehicleService } from '../services/vehicleService';
import { sparepartService } from '../services/sparepartService';
import { validateKmInput } from '../utils/kmCalculator';
import ReplacementModal from '../components/ReplacementModal';
import HistoryTab from '../components/HistoryTab';
import { Trash2, AlertTriangle, Wrench, Plus, ChevronLeft, AlertCircle } from 'lucide-react-native';

// Hallmark - genre: modern-minimal - macrostructure: Stat-Led - design-system: none - designed-as-app
// Structural fingerprint: Numbered display, Asymmetric spans, Hairline dividers, Typographic buttons.

type DetailTab = 'current' | 'history';

interface HomeScreenProps {
  vehicle: UserVehicle;
  onVehicleUpdate: () => void;
  onNavigateAdd: () => void;
  onGoBack: (() => void) | null;
}

export default function HomeScreen({ vehicle, onVehicleUpdate, onNavigateAdd, onGoBack }: HomeScreenProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [kmInput, setKmInput] = useState('');
  const [kmError, setKmError] = useState<string | null>(null);
  const [spareparts, setSpareparts] = useState<SparepartWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('current');
  const [selectedSparepart, setSelectedSparepart] = useState<SparepartWithDetails | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showKmInput, setShowKmInput] = useState(false);

  const fetchSpareparts = useCallback(async () => {
    try {
      const data = await sparepartService.getTrackedSpareparts(vehicle.id, vehicle.current_km);
      setSpareparts(data);
    } catch { Alert.alert('Error', 'Gagal memuat data sparepart.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [vehicle.id, vehicle.current_km]);

  useEffect(() => { setLoading(true); fetchSpareparts(); }, [fetchSpareparts]);

  const handleUpdateKm = async () => {
    const newKm = parseInt(kmInput);
    const error = validateKmInput(isNaN(newKm) ? null : newKm, vehicle.current_km);
    if (error) { setKmError(error); return; }
    setSaving(true); setKmError(null);
    try {
      await vehicleService.updateKm(vehicle.id, newKm);
      await sparepartService.refreshStatuses(vehicle.id, newKm);
      setKmInput(''); setShowKmInput(false); onVehicleUpdate();
    } catch { Alert.alert('Error', 'Gagal menyimpan KM.'); }
    finally { setSaving(false); }
  };

  const handleReplace = (sp: SparepartWithDetails) => { setSelectedSparepart(sp); setShowReplaceModal(true); };

  const handleConfirmReplace = async (brandName: string, cost: number) => {
    if (!selectedSparepart) return;
    try {
      await sparepartService.replaceSparepart(selectedSparepart.id, vehicle.current_km, brandName, selectedSparepart.custom_interval, cost);
      setShowReplaceModal(false); setSelectedSparepart(null);
      await fetchSpareparts(); onVehicleUpdate();
    } catch { Alert.alert('Error', 'Gagal menyimpan penggantian sparepart.'); }
  };

  const handleDelete = (sp: SparepartWithDetails) => {
    Alert.alert('Hapus Sparepart', 'Hapus sparepart ini? Semua riwayat penggantian akan dihapus.',
      [{ text: 'Batal', style: 'cancel' }, {
        text: 'Hapus', style: 'destructive',
        onPress: async () => { try { await sparepartService.deleteSparepart(sp.id); await fetchSpareparts(); onVehicleUpdate(); } catch { Alert.alert('Error', 'Gagal menghapus sparepart.'); } },
      }]
    );
  };

  const overdueItems = spareparts.filter((s) => s.status === 'Overdue');
  const onRefresh = () => { setRefreshing(true); onVehicleUpdate(); };
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  useEffect(() => { setHistoryRefreshKey((k) => k + 1); }, [vehicle]);

  const mostCritical = overdueItems.length > 0 ? overdueItems[0] : null;

  const renderSparepartCard = ({ item }: { item: SparepartWithDetails }) => {
    const isOverdue = item.status === 'Overdue';
    const isWarning = item.status === 'Warning';
    const statusColor = isOverdue ? COLORS.danger : isWarning ? COLORS.warning : COLORS.textPrimary;
    const remaining = item.custom_interval - (vehicle.current_km - item.km_at_setup);
    
    // Asymmetric spans for stat-led minimalism
    return (
      <View style={[styles.spItem, isOverdue && styles.spItemOverdue]}>
        <View style={styles.spRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.spTitle, isOverdue && { color: COLORS.danger }]}>{item.master_data?.sparepart_name}</Text>
            <Text style={styles.spMeta}>Int: {item.custom_interval.toLocaleString()} km · Last: {item.km_at_setup.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.spStatLarge, { color: statusColor }]}>
              {isOverdue ? `-${Math.abs(remaining).toLocaleString()}` : remaining.toLocaleString()}
            </Text>
            <Text style={[styles.spStatLabel, isOverdue && { color: COLORS.danger }]}>
              {isOverdue ? 'OVERDUE' : 'LEFT'}
            </Text>
          </View>
        </View>

        <View style={styles.spActions}>
          <TouchableOpacity onPress={() => handleReplace(item)} style={styles.actionBtn}>
            <Text style={[styles.actionBtnText, isOverdue && { color: COLORS.danger, fontWeight: '700' }]}>
              [ Replace ]
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Text style={styles.actionBtnTextMuted}>[ Remove ]</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Minimalist Top Nav */}
      <View style={styles.topNav}>
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={styles.navLink}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.navTitle}>{vehicle.plate_number || 'UNIT'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={activeTab === 'current' ? spareparts : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={renderSparepartCard}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.vehicleName}>{vehicle.vehicle_name}</Text>
            
            {/* Stat-Led Odometer */}
            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>{vehicle.current_km.toLocaleString()}</Text>
              <Text style={styles.heroUnit}>KM</Text>
            </View>

            {showKmInput ? (
              <View style={styles.kmForm}>
                <TextInput
                  style={styles.kmInputMinimal}
                  placeholder="000"
                  placeholderTextColor={COLORS.textTertiary}
                  value={kmInput}
                  onChangeText={(t) => { setKmInput(t); setKmError(null); }}
                  keyboardType="numeric"
                  autoFocus
                />
                {kmError && <Text style={styles.fieldErr}>{kmError}</Text>}
                <View style={styles.kmFormActions}>
                  <TouchableOpacity onPress={handleUpdateKm} disabled={saving}>
                    <Text style={styles.actionBtnText}>[ {saving ? 'Saving...' : 'Save'} ]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowKmInput(false); setKmInput(''); setKmError(null); }}>
                    <Text style={styles.actionBtnTextMuted}>[ Cancel ]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowKmInput(true)} style={styles.updateBtn}>
                <Text style={styles.actionBtnText}>[ Update ODO ]</Text>
              </TouchableOpacity>
            )}

            {/* Overdue Callout (No more hazard tape, just minimalist alert) */}
            {mostCritical && activeTab === 'current' && (
              <View style={styles.alertBox}>
                <AlertCircle size={16} color={COLORS.danger} />
                <Text style={styles.alertText}>
                  {mostCritical.master_data?.sparepart_name} is overdue by {Math.abs((vehicle.current_km - mostCritical.km_at_setup) - mostCritical.custom_interval).toLocaleString()} km.
                </Text>
              </View>
            )}

            {/* Floating Pill Nav */}
            <View style={styles.pillNav}>
              <TouchableOpacity 
                style={[styles.pill, activeTab === 'current' && styles.pillActive]} 
                onPress={() => setActiveTab('current')}
              >
                <Text style={[styles.pillText, activeTab === 'current' && styles.pillTextActive]}>PARTS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.pill, activeTab === 'history' && styles.pillActive]} 
                onPress={() => setActiveTab('history')}
              >
                <Text style={[styles.pillText, activeTab === 'history' && styles.pillTextActive]}>LOG</Text>
              </TouchableOpacity>
            </View>

            {/* History Tab Content */}
            {activeTab === 'history' && (
              <HistoryTab vehicleId={vehicle.id} refreshKey={historyRefreshKey} />
            )}

            {loading && activeTab === 'current' && (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
            )}
          </View>
        }
        ListFooterComponent={
          activeTab === 'current' && !loading ? (
            <TouchableOpacity style={styles.addGhost} onPress={onNavigateAdd}>
              <Text style={styles.addGhostText}>+ Add Tracked Part</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          activeTab === 'current' && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>0 parts tracked.</Text>
            </View>
          ) : null
        }
      />

      <ReplacementModal
        visible={showReplaceModal}
        sparepartName={selectedSparepart?.master_data?.sparepart_name || ''}
        onConfirm={handleConfirmReplace}
        onCancel={() => { setShowReplaceModal(false); setSelectedSparepart(null); }}
      />
    </View>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  navLink: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary },
  navTitle: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },

  scrollContent: { paddingBottom: 120 },
  headerBlock: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },
  
  vehicleName: { fontFamily: FONT_FAMILY.display, fontWeight: '400', fontSize: 24, color: COLORS.textSecondary, marginBottom: 8 },
  
  heroStat: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 },
  heroNumber: { fontFamily: FONT_FAMILY.mono, fontSize: 64, fontWeight: '300', color: COLORS.textPrimary, letterSpacing: -2 },
  heroUnit: { fontFamily: FONT_FAMILY.mono, fontSize: 16, color: COLORS.textTertiary, letterSpacing: 1 },

  updateBtn: { alignSelf: 'flex-start', marginTop: 8 },
  actionBtnText: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textPrimary },
  actionBtnTextMuted: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textTertiary },

  kmForm: { marginTop: 16, borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingLeft: 16 },
  kmInputMinimal: { fontFamily: FONT_FAMILY.mono, fontSize: 24, color: COLORS.textPrimary, height: 40, padding: 0 },
  kmFormActions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  fieldErr: { color: COLORS.danger, fontFamily: FONT_FAMILY.mono, fontSize: 12, marginTop: 4 },

  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 32, padding: 16, backgroundColor: COLORS.dangerContainer, borderRadius: 0 },
  alertText: { fontFamily: FONT_FAMILY.body, fontSize: 14, color: COLORS.danger, flex: 1, lineHeight: 20 },

  pillNav: { flexDirection: 'row', gap: 8, marginTop: 48, marginBottom: 16 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: COLORS.border },
  pillActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  pillText: { fontFamily: FONT_FAMILY.mono, fontSize: 12, color: COLORS.textSecondary, letterSpacing: 0.5 },
  pillTextActive: { color: COLORS.bg },

  spItem: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 20, paddingHorizontal: 24 },
  spItemOverdue: { borderBottomColor: COLORS.danger + '40' },
  spRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spTitle: { fontFamily: FONT_FAMILY.display, fontSize: 18, color: COLORS.textPrimary, marginBottom: 4 },
  spMeta: { fontFamily: FONT_FAMILY.mono, fontSize: 12, color: COLORS.textTertiary },
  spStatLarge: { fontFamily: FONT_FAMILY.mono, fontSize: 24, fontWeight: '300', color: COLORS.textPrimary, letterSpacing: -1 },
  spStatLabel: { fontFamily: FONT_FAMILY.mono, fontSize: 10, color: COLORS.textTertiary, letterSpacing: 1, alignSelf: 'flex-end' },
  spActions: { flexDirection: 'row', gap: 16, marginTop: 16 },
  actionBtn: { paddingVertical: 4 },

  addGhost: { marginHorizontal: 24, marginTop: 24, paddingVertical: 24, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center' },
  addGhostText: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontFamily: FONT_FAMILY.mono, fontSize: 14, color: COLORS.textTertiary },
});
