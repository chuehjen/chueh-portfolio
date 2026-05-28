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
import { formatCurrency } from '../../src/utils/formatters';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { deleteHolding, upsertHolding } from '../../src/data/storage';
import { Holding } from '../../src/domain/types';
import { getSector } from '../../src/data/sector-map';

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
  const { holdings, prices, summary, details, isLoading, refresh, loadData } = usePortfolio();
  const { score } = useHealthScore(holdings, prices);
  const [refreshing, setRefreshing] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortKey>('value');
  const [showModal, setShowModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormData>(EMPTY_FORM);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

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
    Alert.alert('确认删除', `删除 ${symbol} ?`, [
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
      </View>

      {/* Sort Bar + Add Button */}
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
        <TouchableOpacity style={[styles.importBtn, { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#00C851', marginTop: 10 }]} onPress={openAdd}>
          <Text style={[styles.importBtnText, { color: '#00C851' }]}>手动添加</Text>
        </TouchableOpacity>
        {renderModal()}
      </View>
    );
  }

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
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>数量</Text>
              <TextInput
                style={styles.formInput}
                value={form.shares}
                onChangeText={(v) => setForm({ ...form, shares: v })}
                placeholder="持有股数"
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

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedDetails}
        keyExtractor={(item) => item.holding.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={() => showActions(item.holding)}
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
      {renderModal()}
    </View>
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
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#00C851' },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
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
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 20 },
  formRow: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#8E8EA0', marginBottom: 6 },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F0F0F5' },
  currencyBtnActive: { backgroundColor: '#00C851' },
  currencyBtnText: { fontSize: 13, fontWeight: '600', color: '#8E8EA0' },
  currencyBtnTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F0F0F5', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#8E8EA0' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#00C851', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
