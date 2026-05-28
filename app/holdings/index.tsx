import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { usePortfolio } from '../../src/hooks/use-portfolio';
import { useHealthScore } from '../../src/hooks/use-health-score';
import { formatCurrency, formatPercent } from '../../src/utils/formatters';
import { useRouter } from 'expo-router';

type SortKey = 'value' | 'pnl' | 'name';

export default function HoldingsScreen() {
  const router = useRouter();
  const { holdings, prices, summary, details, isLoading, refresh } = usePortfolio();
  const { score } = useHealthScore(holdings, prices);
  const [refreshing, setRefreshing] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortKey>('value');

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const sortedDetails = React.useMemo(() => {
    const items = [...details];
    switch (sortBy) {
      case 'pnl': return items.sort((a, b) => b.pnl - a.pnl);
      case 'name': return items.sort((a, b) => a.holding.name.localeCompare(b.holding.name));
      default: return items.sort((a, b) => b.value - a.value);
    }
  }, [details, sortBy]);

  const healthColor = (s: number) => s >= 70 ? '#00C851' : s >= 40 ? '#FFB300' : '#FF5252';

  const renderHeader = () => (
    <View>
      {/* Health Score Card */}
      <View style={styles.healthCard}>
        <View style={styles.healthTop}>
          <View style={styles.healthMain}>
            <Text style={[styles.healthScoreNum, { color: healthColor(score.overall) }]}>
              {score.overall}
            </Text>
            <Text style={styles.healthLabel}>健康评分</Text>
          </View>
          <View style={styles.healthGrid}>
            {[
              { label: '集中度', value: score.components.concentration },
              { label: '行业', value: score.components.diversification },
              { label: '波动率', value: score.components.volatility },
              { label: '回撤', value: score.components.drawdown },
            ].map((item) => (
              <View key={item.label} style={styles.healthItem}>
                <Text style={[styles.healthItemValue, { color: healthColor(item.value) }]}>
                  {item.value}
                </Text>
                <Text style={styles.healthItemLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
        {score.alerts.length > 0 && (
          <View style={styles.alertsRow}>
            {score.alerts.slice(0, 2).map((alert, i) => (
              <Text key={i} style={styles.alertText} numberOfLines={1}>
                {alert}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.countLabel}>{holdings.length} 只持仓</Text>
        <View style={styles.sortButtons}>
          {(['value', 'pnl', 'name'] as SortKey[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.sortBtn, sortBy === key && styles.sortBtnActive]}
              onPress={() => setSortBy(key)}
            >
              <Text style={[styles.sortBtnText, sortBy === key && styles.sortBtnTextActive]}>
                {key === 'value' ? '市值' : key === 'pnl' ? '盈亏' : '名称'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  if (holdings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无持仓数据</Text>
        <TouchableOpacity style={styles.importBtn} onPress={() => router.push('/import')}>
          <Text style={styles.importBtnText}>导入持仓</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={sortedDetails}
      keyExtractor={(item) => item.holding.id}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.6}
          onPress={() => router.push(`/holdings/${encodeURIComponent(item.holding.symbol)}`)}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.rowSymbol}>{item.holding.symbol}</Text>
            <Text style={styles.rowName} numberOfLines={1}>{item.holding.name}</Text>
          </View>
          <View style={styles.rowCenter}>
            <Text style={styles.rowShares}>{item.holding.shares}股</Text>
            <Text style={styles.rowWeight}>{item.weight.toFixed(1)}%</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowValue}>{formatCurrency(item.value, item.holding.currency)}</Text>
            <View style={[styles.rowPill, item.pnl >= 0 ? styles.pillUp : styles.pillDown]}>
              <Text style={[styles.rowPillText, item.pnl >= 0 ? styles.textUp : styles.textDown]}>
                {item.pnl >= 0 ? '+' : ''}{item.pnlPercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C851" />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFE' },
  listContent: { paddingBottom: 32 },
  emptyContainer: { flex: 1, backgroundColor: '#FAFBFE', justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#8E8EA0' },
  importBtn: { marginTop: 16, backgroundColor: '#00C851', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  importBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  healthCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#00C851',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  healthTop: { flexDirection: 'row', alignItems: 'center' },
  healthMain: { alignItems: 'center', marginRight: 24 },
  healthScoreNum: { fontSize: 42, fontWeight: '800' },
  healthLabel: { fontSize: 11, color: '#8E8EA0', marginTop: 2 },
  healthGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  healthItem: { width: '46%', alignItems: 'center', paddingVertical: 8, backgroundColor: '#FAFBFE', borderRadius: 10 },
  healthItemValue: { fontSize: 18, fontWeight: '700' },
  healthItemLabel: { fontSize: 11, color: '#8E8EA0', marginTop: 2 },
  alertsRow: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: '#F0F0F5' },
  alertText: { fontSize: 12, color: '#FF8F00', lineHeight: 18 },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countLabel: { fontSize: 13, fontWeight: '600', color: '#8E8EA0' },
  sortButtons: { flexDirection: 'row', gap: 6 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F0F0F5' },
  sortBtnActive: { backgroundColor: '#00C851' },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: '#8E8EA0' },
  sortBtnTextActive: { color: '#FFFFFF' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  rowLeft: { flex: 1 },
  rowSymbol: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  rowName: { fontSize: 11, color: '#8E8EA0', marginTop: 2, maxWidth: 100 },
  rowCenter: { alignItems: 'center', marginHorizontal: 12 },
  rowShares: { fontSize: 12, color: '#8E8EA0' },
  rowWeight: { fontSize: 11, color: '#B0B0C0', marginTop: 1 },
  rowRight: { alignItems: 'flex-end' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  rowPill: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pillUp: { backgroundColor: '#00C85112' },
  pillDown: { backgroundColor: '#FF525212' },
  rowPillText: { fontSize: 12, fontWeight: '700' },
  textUp: { color: '#00C851' },
  textDown: { color: '#FF5252' },
});
