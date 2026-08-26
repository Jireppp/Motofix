import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, FONT_FAMILY } from '../constants/theme';
import { sparepartService } from '../services/sparepartService';
import { getSparepartIcon } from '../constants/assets';

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
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderHistoryCard = ({ item }: { item: HistoryItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 16 }}>🔧</Text>
        </View>
        <View style={styles.cardTitleSection}>
          <Text style={styles.sparepartName}>{item.sparepart_name.toUpperCase()}</Text>
          <Text style={styles.dateText}>{formatDate(item.replaced_at).toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>BRAND</Text>
          <Text style={styles.detailValue}>{item.brand_name.toUpperCase()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ODOMETER AT REPLACE</Text>
          <Text style={styles.detailValueBold}>
            {item.km_at_replacement.toLocaleString()} KM
          </Text>
        </View>
        {item.cost > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SERVICE COST</Text>
            <Text style={styles.detailValueBold}>
              Rp {item.cost.toLocaleString('id-ID')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={renderHistoryCard}
      contentContainerStyle={styles.listContent}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={COLORS.primary} style={{ padding: SPACING.md }} />
        ) : hasMore && history.length > 0 ? (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
            <Text style={styles.loadMoreText}>LOAD MORE ENTRIES...</Text>
          </TouchableOpacity>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.ring}><Text style={styles.emptyIcon}>📋</Text></View>
          <Text style={styles.emptyTitle}>NO LOGS FOUND</Text>
          <Text style={styles.emptySubtitle}>
            Replacement history will appear here once you log a part replacement.
          </Text>
        </View>
      }
    />
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 32, height: 32, borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardTitleSection: {
    flex: 1,
  },
  sparepartName: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
  },
  dateText: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  cardBody: {
    backgroundColor: COLORS.surface2,
    borderRadius: BORDER_RADIUS.sm,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: 12.5,
    color: COLORS.textPrimary,
  },
  detailValueBold: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 12.5,
    color: COLORS.primary,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    fontFamily: FONT_FAMILY.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 30,
    gap: 12,
  },
  ring: {
    width: 60, height: 60, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surface2,
    borderWidth: 1.5, borderColor: COLORS.borderStrong, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
