import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { FONT_FAMILY } from '../constants/theme';
import { EMPTY_STATE_ICONS } from '../constants/assets';
import { sparepartService } from '../services/sparepartService';
import { ChevronDown, ChevronLeft, Check, X } from 'lucide-react-native';
import { haptic } from '../utils/haptics';

// Hallmark - genre: modern-minimal - macrostructure: Index-First - design-system: none - designed-as-app
// Structural fingerprint: Full-bleed rows, Hairline dividers, Monospace telemetry, Typographic actions

interface HistoryTabProps {
  vehicleId: string;
  refreshKey: number;
}

interface HistoryItem {
  id: string;
  sparepart_id: string;
  sparepart_name: string;
  km_at_replacement: number;
  brand_name: string;
  replaced_at: string;
  cost: number;
}

const MONTHS_CATALOG = [
  { id: 1, label: '01 · JANUARY', short: 'JAN' },
  { id: 2, label: '02 · FEBRUARY', short: 'FEB' },
  { id: 3, label: '03 · MARCH', short: 'MAR' },
  { id: 4, label: '04 · APRIL', short: 'APR' },
  { id: 5, label: '05 · MAY', short: 'MAY' },
  { id: 6, label: '06 · JUNE', short: 'JUN' },
  { id: 7, label: '07 · JULY', short: 'JUL' },
  { id: 8, label: '08 · AUGUST', short: 'AUG' },
  { id: 9, label: '09 · SEPTEMBER', short: 'SEP' },
  { id: 10, label: '10 · OCTOBER', short: 'OCT' },
  { id: 11, label: '11 · NOVEMBER', short: 'NOV' },
  { id: 12, label: '12 · DECEMBER', short: 'DEC' },
];

type FilterState =
  | { mode: 'all' }
  | { mode: 'month_year'; month: number; year: number };

export default function HistoryTab({ vehicleId, refreshKey }: HistoryTabProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Active filter state
  const [filter, setFilter] = useState<FilterState>({ mode: 'all' });

  // Dropdown modal 2-step navigation state
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalStep, setModalStep] = useState<'month' | 'year'>('month');
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null);

  const fetchHistory = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      const result = await sparepartService.getVehicleHistory(vehicleId, pageNum, 250);
      if (append) {
        setHistory((prev) => [...prev, ...result.data]);
      } else {
        setHistory(result.data);
      }
      setPage(pageNum);
      setHasMore(result.hasMore);
    } catch (err) {
      console.log('History fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    setLoading(true);
    fetchHistory(0, false);
  }, [vehicleId, refreshKey, fetchHistory]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchHistory(page + 1, true);
  };

  // Dynamic available years list: range of ±3 years around now + any historical years
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    const currentYear = new Date().getFullYear();

    // Default range (past 4 years to next 2 years)
    for (let y = currentYear + 2; y >= currentYear - 4; y--) {
      yearSet.add(y);
    }

    // Include any years found in actual database records
    history.forEach((item) => {
      try {
        const d = new Date(item.replaced_at);
        if (!isNaN(d.getFullYear())) {
          yearSet.add(d.getFullYear());
        }
      } catch {
        // ignore
      }
    });

    return Array.from(yearSet).sort((a, b) => b - a);
  }, [history]);

  // Filtered logs
  const filteredHistory = useMemo(() => {
    if (filter.mode === 'all') return history;

    return history.filter((item) => {
      try {
        const d = new Date(item.replaced_at);
        if (isNaN(d.getTime())) return false;
        return (
          d.getFullYear() === filter.year &&
          d.getMonth() + 1 === filter.month
        );
      } catch {
        return false;
      }
    });
  }, [history, filter]);

  // Total Maintenance Cost for the active filter
  const totalCost = useMemo(() => {
    return filteredHistory.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  }, [filteredHistory]);

  // Single trigger button label
  const filterDisplayLabel = useMemo(() => {
    if (filter.mode === 'all') return 'ALL TIME';
    const foundMonth = MONTHS_CATALOG.find((m) => m.id === filter.month);
    const monthShort = foundMonth ? foundMonth.short : String(filter.month);
    return `${monthShort} ${filter.year}`;
  }, [filter]);

  // Selected month name when in step 2 (Year picker)
  const step2MonthName = useMemo(() => {
    if (!selectedMonthId) return '';
    const m = MONTHS_CATALOG.find((item) => item.id === selectedMonthId);
    return m ? m.short : '';
  }, [selectedMonthId]);

  const handleOpenDropdown = () => {
    haptic.selection();
    setModalStep('month');
    setSelectedMonthId(filter.mode === 'month_year' ? filter.month : null);
    setShowDropdown(true);
  };

  const handleSelectMonth = (monthId: number) => {
    haptic.selection();
    setSelectedMonthId(monthId);
    setModalStep('year');
  };

  const handleSelectYear = (year: number) => {
    if (!selectedMonthId) return;
    haptic.success();
    setFilter({
      mode: 'month_year',
      month: selectedMonthId,
      year,
    });
    setShowDropdown(false);
  };

  const handleSelectAllTime = () => {
    haptic.success();
    setFilter({ mode: 'all' });
    setShowDropdown(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderHistoryRow = (item: HistoryItem) => (
    <View key={item.id} style={styles.historyRow}>
      <View style={styles.mainCol}>
        <Text style={styles.partName} numberOfLines={1}>
          {item.sparepart_name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaDate}>
            {formatDate(item.replaced_at).toUpperCase()}
          </Text>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.brandTag}>
            BRAND // {item.brand_name ? item.brand_name.toUpperCase() : 'OEM'}
          </Text>
        </View>
        {item.cost > 0 ? (
          <Text style={styles.costText}>
            EXPENSE // Rp {item.cost.toLocaleString('id-ID')}
          </Text>
        ) : (
          <Text style={styles.costTextMuted}>
            EXPENSE // Rp 0 (UNLOGGED)
          </Text>
        )}
      </View>

      <View style={styles.statCol}>
        <Text style={styles.odoStat}>
          {item.km_at_replacement.toLocaleString()}
        </Text>
        <Text style={styles.odoLabel}>AT SERVICE</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Image
          source={EMPTY_STATE_ICONS.history}
          style={{ width: 44, height: 44, tintColor: COLORS.textTertiary, opacity: 0.75 }}
          resizeMode="contain"
        />
        <Text style={styles.emptyTitle}>0 SERVICE LOGS RECORDED</Text>
        <Text style={styles.emptySubtitle}>
          Maintenance and replacement records will appear here chronologically.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Telemetry Expenditure Summary Panel ─── */}
      <View style={styles.summaryPanel}>
        <View style={styles.summaryRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.summaryLabel}>TOTAL MAINTENANCE COST</Text>
            <Text style={styles.summaryAmount}>
              Rp {totalCost.toLocaleString('id-ID')}
            </Text>
          </View>

          {/* Single Dropdown Trigger Button */}
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={handleOpenDropdown}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownBtnText}>
              {filterDisplayLabel}
            </Text>
            <ChevronDown size={14} color={COLORS.textSecondary} strokeWidth={2} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Filtered History List ─── */}
      {filteredHistory.length > 0 ? (
        filteredHistory.map(renderHistoryRow)
      ) : (
        <View style={styles.filteredEmptyState}>
          <Text style={styles.filteredEmptyTitle}>
            NO SERVICE LOGS IN {filterDisplayLabel}
          </Text>
          <Text style={styles.filteredEmptySubtitle}>
            No component replacements were logged during this period.
          </Text>
          <TouchableOpacity
            style={styles.resetFilterBtn}
            onPress={handleSelectAllTime}
            activeOpacity={0.75}
          >
            <Text style={styles.resetFilterText}>[ Show All Time ]</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasMore && filter.mode === 'all' && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={loadMore}
          disabled={loadingMore}
          activeOpacity={0.7}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.loadMoreText}>[ Load Older Entries ]</Text>
          )}
        </TouchableOpacity>
      )}

      {/* ─── Single Period 2-Step Dropdown Modal ─── */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              {modalStep === 'year' ? (
                <TouchableOpacity
                  onPress={() => {
                    haptic.light();
                    setModalStep('month');
                  }}
                  style={styles.backBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <ChevronLeft size={16} color={COLORS.textPrimary} strokeWidth={2.5} />
                  <Text style={styles.modalTitle}>[ YEAR FOR {step2MonthName} ]</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.modalTitle}>[ 01 // SELECT MONTH ]</Text>
              )}

              <TouchableOpacity
                onPress={() => setShowDropdown(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={18} color={COLORS.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Step 1: Select Month */}
            {modalStep === 'month' && (
              <FlatList
                data={MONTHS_CATALOG}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      filter.mode === 'all' && styles.dropdownItemActive,
                      styles.allTimeItem,
                    ]}
                    onPress={handleSelectAllTime}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        filter.mode === 'all' && styles.dropdownItemTextActive,
                      ]}
                    >
                      ALL TIME (ALL DATES)
                    </Text>
                    {filter.mode === 'all' && (
                      <Check size={16} color={COLORS.primary} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                }
                renderItem={({ item }) => {
                  const isCurrentActiveMonth =
                    filter.mode === 'month_year' && filter.month === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        isCurrentActiveMonth && styles.dropdownItemActive,
                      ]}
                      onPress={() => handleSelectMonth(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isCurrentActiveMonth && styles.dropdownItemTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <ChevronDown
                        size={14}
                        color={COLORS.textTertiary}
                        strokeWidth={2}
                        style={{ transform: [{ rotate: '-90deg' }] }}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Step 2: Select Year */}
            {modalStep === 'year' && (
              <FlatList
                data={availableYears}
                keyExtractor={(item) => String(item)}
                renderItem={({ item }) => {
                  const isCurrentActive =
                    filter.mode === 'month_year' &&
                    filter.month === selectedMonthId &&
                    filter.year === item;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        isCurrentActive && styles.dropdownItemActive,
                      ]}
                      onPress={() => handleSelectYear(item)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isCurrentActive && styles.dropdownItemTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                      {isCurrentActive && (
                        <Check size={16} color={COLORS.primary} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Expenditure Summary Panel ───
  summaryPanel: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 10,
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  summaryAmount: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 26,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },

  // ─── Single Dropdown Trigger Button ───
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  dropdownBtnText: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 12,
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
  },

  // ─── History Rows ───
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mainCol: {
    flex: 1,
    paddingRight: 16,
  },
  partName: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaDate: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  metaDivider: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    color: COLORS.borderStrong,
  },
  brandTag: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  costText: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 11,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  costTextMuted: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  statCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  odoStat: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  odoLabel: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 9,
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginTop: 2,
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  loadMoreText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  filteredEmptyState: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filteredEmptyTitle: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  filteredEmptySubtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFilterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  resetFilterText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 12,
    letterSpacing: 1,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  // ─── Dropdown Modal Styles ───
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 0,
    maxHeight: 380,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 12,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  allTimeItem: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface2,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.surface2,
  },
  dropdownItemText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 13,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  dropdownItemTextActive: {
    fontFamily: FONT_FAMILY.monoBold,
    color: COLORS.textPrimary,
  },
});
