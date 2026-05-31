import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePortfolio } from '../../src/hooks/use-portfolio';
import { useHealthScore } from '../../src/hooks/use-health-score';
import { useHoldingInsights } from '../../src/hooks/use-holding-insights';
import { useRouter, useFocusEffect } from 'expo-router';
import { upsertHolding } from '../../src/data/storage';
import { Holding } from '../../src/domain/types';
import { HoldingRow } from '../../src/components/portfolio/HoldingRow';
import { HoldingFormModal } from '../../src/components/portfolio/HoldingFormModal';
import { STRATEGY_DESCRIPTIONS } from '../../src/data/insight-service';
import { SECTOR_DESCRIPTIONS } from '../../src/data/sector-map';
import { color, spacing, radius, font, shadow, semantic } from '../../src/theme/tokens';

type SortKey = 'value' | 'pnl' | 'name';

export default function HoldingsScreen() {
  const router = useRouter();
  const { holdings, prices, details, refresh, loadData } = usePortfolio();
  const { score } = useHealthScore(holdings, prices);
  const { insights } = useHoldingInsights(holdings, prices);
  const [refreshing, setRefreshing] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortKey>('value');
  const [showModal, setShowModal] = React.useState(false);
  const [editingHolding, setEditingHolding] = React.useState<Holding | null>(null);
  const [showLegend, setShowLegend] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const sortedDetails = React.useMemo(() => {
    const items = [...details];
    switch (sortBy) {
      case 'pnl': return items.sort((a, b) => b.pnl - a.pnl);
      case 'name': return items.sort((a, b) => a.holding.name.localeCompare(b.holding.name));
      default: return items.sort((a, b) => b.value - a.value);
    }
  }, [details, sortBy]);

  const openAdd = () => {
    setEditingHolding(null);
    setShowModal(true);
  };

  const handleSave = async (holding: Holding) => {
    await upsertHolding(holding);
    await loadData();
  };

  const goToDetail = (h: Holding) => {
    router.push(`/holdings/${encodeURIComponent(h.symbol)}`);
  };

  function renderModal() {
    return (
      <HoldingFormModal
        visible={showModal}
        initial={editingHolding}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    );
  }

  const renderHeader = () => (
    <View>
      {/* Health Score Card */}
      <View style={styles.healthCard}>
        <View style={styles.healthTop}>
          <View style={styles.healthMain}>
            <Text style={[styles.healthScoreNum, { color: semantic.scoreColor(score.overall) }]}>
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
                <Text style={[styles.healthItemValue, { color: semantic.scoreColor(item.value) }]}>
                  {item.value}
                </Text>
                <Text style={styles.healthItemLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Legend Toggle (贴在健康评分下方) */}
      <TouchableOpacity
        style={styles.legendToggle}
        activeOpacity={0.7}
        onPress={() => setShowLegend((v) => !v)}
      >
        <Text style={styles.legendToggleText}>
          {showLegend ? '收起说明' : '名词说明'}
        </Text>
        <Text style={styles.legendChevron}>{showLegend ? '∧' : '∨'}</Text>
      </TouchableOpacity>

      {showLegend && (
        <View style={styles.legendCard}>
          <Text style={styles.legendSectionTitle}>健康评分维度</Text>
          {[
            { name: '集中度', desc: '单只持仓占比是否过高，越分散越抗风险' },
            { name: '行业', desc: '行业分布是否均衡，避免押注单一赛道' },
            { name: '波动率', desc: '组合整体涨跌剧烈程度，越低越稳' },
            { name: '回撤', desc: '从历史高点跌下来的最大幅度，衡量极端下行风险' },
          ].map((s) => (
            <View key={s.name} style={styles.legendItem}>
              <Text style={styles.legendTermText}>{s.name}</Text>
              <Text style={styles.legendDesc}>{s.desc}</Text>
            </View>
          ))}
          <View style={styles.legendDivider} />
          <Text style={styles.legendSectionTitle}>AI 策略标签</Text>
          {STRATEGY_DESCRIPTIONS.map((s) => (
            <View key={s.name} style={styles.legendItem}>
              <Text style={[styles.legendTermText, { color: color.brand.primary }]}>{s.name}</Text>
              <Text style={styles.legendDesc}>{s.desc}</Text>
            </View>
          ))}
          <View style={styles.legendDivider} />
          <Text style={styles.legendSectionTitle}>行业分类</Text>
          {SECTOR_DESCRIPTIONS.map((s) => (
            <View key={s.name} style={styles.legendItem}>
              <Text style={styles.legendTermText}>{s.name}</Text>
              <Text style={styles.legendDesc}>{s.desc}</Text>
            </View>
          ))}
          <Text style={styles.legendFooter}>策略标签后的百分比 = AI 判定的置信度</Text>
        </View>
      )}

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.countLabel}>{holdings.length} 只持仓</Text>
        <View style={styles.sortButtons}>
          {(['name', 'value', 'pnl'] as SortKey[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.sortBtn, sortBy === key && styles.sortBtnActive]}
              onPress={() => setSortBy(key)}
            >
              <Text style={[styles.sortBtnText, sortBy === key && styles.sortBtnTextActive]}>
                {key === 'name' ? '名称' : key === 'value' ? '市值' : '盈亏'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <Text style={styles.topBarTitle}>持仓</Text>
      <TouchableOpacity style={styles.topBarAdd} onPress={openAdd}>
        <Text style={styles.topBarAddText}>+ 添加</Text>
      </TouchableOpacity>
    </View>
  );

  if (holdings.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderTopBar()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无持仓数据</Text>
          <TouchableOpacity style={styles.importBtn} onPress={() => router.push('/import')}>
            <Text style={styles.importBtnText}>导入持仓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={openAdd}>
            <Text style={styles.outlineBtnText}>手动添加</Text>
          </TouchableOpacity>
        </View>
        {renderModal()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderTopBar()}
      <FlatList
        data={sortedDetails}
        keyExtractor={(item) => item.holding.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          const ins = insights.get(item.holding.symbol);
          return (
            <HoldingRow
              item={item}
              aiTag={ins ? { label: ins.tag, confidence: ins.confidence } : null}
              onPress={(it) => goToDetail(it.holding)}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.brand.primary} />
        }
      />
      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg.app },
  listContent: { paddingBottom: spacing.xxxl },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    height: 44,
    backgroundColor: color.bg.app,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: color.text.primary,
    letterSpacing: -0.3,
  },
  topBarAdd: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: color.brand.primary,
    borderRadius: radius.sm + 2,
  },
  topBarAddText: { ...font.tag, color: color.text.onPrimary },

  emptyContainer: { flex: 1, backgroundColor: color.bg.app, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...font.body, color: color.text.secondary },
  importBtn: {
    marginTop: spacing.lg,
    backgroundColor: color.brand.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  importBtnText: { color: color.text.onPrimary, ...font.body, fontWeight: '700' },
  outlineBtn: {
    marginTop: spacing.sm + 2,
    backgroundColor: color.bg.card,
    borderWidth: 1.5,
    borderColor: color.brand.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  outlineBtnText: { color: color.brand.primary, ...font.body, fontWeight: '700' },

  healthCard: {
    margin: spacing.lg,
    backgroundColor: color.bg.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.elevated,
  },
  healthTop: { flexDirection: 'row', alignItems: 'center' },
  healthMain: { alignItems: 'center', marginRight: spacing.xxl },
  healthScoreNum: { ...font.display, ...semantic.numberStyle },
  healthLabel: { ...font.tiny, color: color.text.secondary, marginTop: 2 },
  healthGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  healthItem: {
    width: '46%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: color.bg.app,
    borderRadius: radius.md,
  },
  healthItemValue: { fontSize: 18, fontWeight: '700', ...semantic.numberStyle },
  healthItemLabel: { ...font.tiny, color: color.text.secondary, marginTop: 2 },

  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  countLabel: { ...font.caption, color: color.text.secondary },
  sortButtons: { flexDirection: 'row', gap: 6 },
  sortBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm + 2,
    backgroundColor: color.bg.subtle,
  },
  sortBtnActive: { backgroundColor: color.brand.primary },
  sortBtnText: { ...font.tag, fontWeight: '600', color: color.text.secondary },
  sortBtnTextActive: { color: color.text.onPrimary },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm + 2,
    backgroundColor: color.brand.primary,
  },
  addBtnText: { ...font.tag, color: color.text.onPrimary },

  // Legend (弱化版)
  legendToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    paddingVertical: 6,
  },
  legendToggleText: { ...font.tiny, color: color.text.tertiary, fontWeight: '500' },
  legendChevron: { ...font.tiny, color: color.text.tertiary, marginLeft: 4 },
  legendCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: color.bg.subtle,
    borderRadius: radius.md,
  },
  legendSectionTitle: {
    ...font.tiny,
    color: color.text.secondary,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  legendTermText: {
    ...font.tiny,
    color: color.text.primary,
    fontWeight: '700',
    width: 64,
    marginRight: spacing.sm,
  },
  legendDesc: { ...font.tiny, color: color.text.secondary, flex: 1, lineHeight: 18 },
  legendDivider: {
    height: 1,
    backgroundColor: color.border.default,
    marginVertical: spacing.sm,
  },
  legendFooter: {
    ...font.tiny,
    color: color.text.tertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: color.bg.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    paddingBottom: 40,
  },
  modalTitle: { ...font.h1, color: color.text.primary, marginBottom: spacing.xl },
  formRow: { marginBottom: spacing.lg },
  formLabel: { ...font.caption, color: color.text.secondary, marginBottom: 6 },
  formInput: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...font.body,
    color: color.text.primary,
    borderWidth: 1,
    borderColor: color.border.default,
  },
  currencyRow: { flexDirection: 'row', gap: spacing.sm },
  currencyBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm + 2,
    backgroundColor: color.bg.subtle,
  },
  currencyBtnActive: { backgroundColor: color.brand.primary },
  currencyBtnText: { ...font.caption, color: color.text.secondary },
  currencyBtnTextActive: { color: color.text.onPrimary },
  sectorWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sectorChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm + 2,
    backgroundColor: color.bg.subtle,
  },
  sectorChipActive: { backgroundColor: color.brand.primary },
  sectorChipText: { fontSize: 12, fontWeight: '600', color: color.text.secondary },
  sectorChipTextActive: { color: color.text.onPrimary },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg - 2,
    backgroundColor: color.bg.subtle,
    alignItems: 'center',
  },
  cancelBtnText: { ...font.body, color: color.text.secondary },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg - 2,
    backgroundColor: color.brand.primary,
    alignItems: 'center',
  },
  saveBtnText: { ...font.body, fontWeight: '700', color: color.text.onPrimary },
});
