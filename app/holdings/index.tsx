import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePortfolio } from '../../src/hooks/use-portfolio';
import { useHealthScore } from '../../src/hooks/use-health-score';
import { useHoldingInsights } from '../../src/hooks/use-holding-insights';
import { useRouter, useFocusEffect } from 'expo-router';
import { deleteHolding, upsertHolding } from '../../src/data/storage';
import { Holding } from '../../src/domain/types';
import { getSector } from '../../src/data/sector-map';
import { HoldingRow } from '../../src/components/portfolio/HoldingRow';
import { STRATEGY_DESCRIPTIONS } from '../../src/data/insight-service';
import { SECTOR_DESCRIPTIONS } from '../../src/data/sector-map';
import { color, spacing, radius, font, shadow, semantic } from '../../src/theme/tokens';

type SortKey = 'value' | 'pnl' | 'name';

interface FormData {
  symbol: string;
  name: string;
  shares: string;
  costBasisPerShare: string;
  currency: string;
}

const EMPTY_FORM: FormData = { symbol: '', name: '', shares: '', costBasisPerShare: '', currency: 'USD' };

export default function HoldingsScreen() {
  const router = useRouter();
  const { holdings, prices, details, refresh, loadData } = usePortfolio();
  const { score } = useHealthScore(holdings, prices);
  const { insights } = useHoldingInsights(holdings, prices);
  const [refreshing, setRefreshing] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortKey>('value');
  const [showModal, setShowModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormData>(EMPTY_FORM);
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
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (h: Holding) => {
    setEditingId(h.id);
    setForm({
      symbol: h.symbol,
      name: h.name,
      shares: String(h.shares),
      costBasisPerShare: String(h.costBasisPerShare),
      currency: h.currency,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.symbol.trim() || !form.shares || !form.costBasisPerShare) {
      Alert.alert('请填写', '代码、数量、成本价为必填项');
      return;
    }
    const holding: Holding = {
      id: editingId || `manual-${Date.now()}`,
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim() || form.symbol.trim().toUpperCase(),
      shares: parseFloat(form.shares),
      costBasisPerShare: parseFloat(form.costBasisPerShare),
      currency: form.currency || 'USD',
      sector: getSector(form.symbol.trim().toUpperCase()),
      importedAt: new Date().toISOString().split('T')[0],
    };
    await upsertHolding(holding);
    setShowModal(false);
    await loadData();
  };

  const handleDelete = (id: string, symbol: string) => {
    Alert.alert('确认删除', `删除 ${symbol}?`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteHolding(id);
          await loadData();
        },
      },
    ]);
  };

  const showActions = (h: Holding) => {
    Alert.alert(h.symbol, '选择操作', [
      { text: '编辑', onPress: () => openEdit(h) },
      { text: '删除', style: 'destructive', onPress: () => handleDelete(h.id, h.symbol) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  function renderModal() {
    return (
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingId ? '编辑持仓' : '添加持仓'}</Text>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>代码</Text>
              <TextInput
                style={styles.formInput}
                value={form.symbol}
                onChangeText={(v) => setForm({ ...form, symbol: v })}
                placeholder="如 AAPL 或 00700.HK"
                placeholderTextColor={color.text.tertiary}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>名称</Text>
              <TextInput
                style={styles.formInput}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="可选，如 Apple Inc"
                placeholderTextColor={color.text.tertiary}
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>数量</Text>
              <TextInput
                style={styles.formInput}
                value={form.shares}
                onChangeText={(v) => setForm({ ...form, shares: v })}
                placeholder="持有股数"
                placeholderTextColor={color.text.tertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>成本价</Text>
              <TextInput
                style={styles.formInput}
                value={form.costBasisPerShare}
                onChangeText={(v) => setForm({ ...form, costBasisPerShare: v })}
                placeholder="每股成本"
                placeholderTextColor={color.text.tertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>币种</Text>
              <View style={styles.currencyRow}>
                {['USD', 'HKD', 'CNY'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.currencyBtn, form.currency === c && styles.currencyBtnActive]}
                    onPress={() => setForm({ ...form, currency: c })}
                  >
                    <Text style={[styles.currencyBtnText, form.currency === c && styles.currencyBtnTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ 添加</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.outlineBtn} onPress={openAdd}>
          <Text style={styles.outlineBtnText}>手动添加</Text>
        </TouchableOpacity>
        {renderModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              onPress={(it) => showActions(it.holding)}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.brand.primary} />
        }
      />
      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg.app },
  listContent: { paddingBottom: spacing.xxxl },

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
