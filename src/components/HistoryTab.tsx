import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONT_FAMILY } from '../constants/theme';
import { sparepartService } from '../services/sparepartService';
import { History } from 'lucide-react-native';

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

export default function HistoryTab({ vehicleId, refreshKey }: HistoryTabProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      const result = await sparepartService.getVehicleHistory(vehicleId, pageNum, 10);
      if (append) {
        setHistory((prev) => [...prev, ...result.data]);
      } else {
        setHistory(result.data);
      }
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
    setPage(0);
    fetchHistory(0, false);
  }, [vehicleId, refreshKey, fetchHistory]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
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
        {item.cost > 0 && (
          <Text style={styles.costText}>
            EXPENSE // Rp {item.cost.toLocaleString('id-ID')}
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
        <History size={26} color={COLORS.textTertiary} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>0 SERVICE LOGS RECORDED</Text>
        <Text style={styles.emptySubtitle}>
          Maintenance and replacement records will appear here chronologically.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {history.map(renderHistoryRow)}

      {hasMore && (
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
});
