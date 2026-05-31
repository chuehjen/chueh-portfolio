import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Holding } from '../../domain/types';
import { getSector, normalizeSector } from '../../data/sector-map';
import { color, spacing, radius, font } from '../../theme/tokens';

interface FormData {
  symbol: string;
  name: string;
  shares: string;
  costBasisPerShare: string;
  currency: string;
  sector: string;
}

const EMPTY_FORM: FormData = {
  symbol: '',
  name: '',
  shares: '',
  costBasisPerShare: '',
  currency: 'USD',
  sector: '',
};

const SECTOR_OPTIONS: { label: string; value: string }[] = [
  { label: '科技', value: 'Technology' },
  { label: '通讯', value: 'Communication Services' },
  { label: '可选消费', value: 'Consumer Discretionary' },
  { label: '必需消费', value: 'Consumer Staples' },
  { label: '金融', value: 'Financials' },
  { label: '医疗', value: 'Healthcare' },
  { label: '能源', value: 'Energy' },
  { label: '工业', value: 'Industrials' },
  { label: '材料', value: 'Materials' },
  { label: '公用事业', value: 'Utilities' },
  { label: '地产', value: 'Real Estate' },
  { label: 'ETF', value: 'ETF' },
  { label: '其他', value: 'Unknown' },
];

interface Props {
  visible: boolean;
  initial: Holding | null; // null = 新增；非空 = 编辑
  onClose: () => void;
  onSave: (h: Holding) => Promise<void> | void;
}

export function HoldingFormModal({ visible, initial, onClose, onSave }: Props) {
  const [form, setForm] = React.useState<FormData>(EMPTY_FORM);

  // 每次打开时重置表单
  React.useEffect(() => {
    if (!visible) return;
    if (initial) {
      setForm({
        symbol: initial.symbol,
        name: initial.name,
        shares: String(initial.shares),
        costBasisPerShare: String(initial.costBasisPerShare),
        currency: initial.currency,
        sector: initial.sector || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [visible, initial]);

  const handleSave = async () => {
    if (!form.symbol.trim() || !form.shares || !form.costBasisPerShare) {
      Alert.alert('请填写', '代码、数量、成本价为必填项');
      return;
    }
    const upperSymbol = form.symbol.trim().toUpperCase();
    const userSector = normalizeSector(form.sector);
    const mapSector = getSector(upperSymbol);
    const finalSector = userSector !== 'Unknown' ? userSector : mapSector;
    const holding: Holding = {
      id: initial?.id || `manual-${Date.now()}`,
      symbol: upperSymbol,
      name: form.name.trim() || upperSymbol,
      shares: parseFloat(form.shares),
      costBasisPerShare: parseFloat(form.costBasisPerShare),
      currency: form.currency || 'USD',
      sector: finalSector,
      importedAt: initial?.importedAt || new Date().toISOString().split('T')[0],
    };
    await onSave(holding);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{initial ? '编辑持仓' : '添加持仓'}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>代码</Text>
              <TextInput
                style={styles.input}
                value={form.symbol}
                onChangeText={(v) => setForm({ ...form, symbol: v })}
                placeholder="如 AAPL 或 00700.HK"
                placeholderTextColor={color.text.tertiary}
                autoCapitalize="characters"
                editable={!initial}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>名称</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="可选，如 Apple Inc"
                placeholderTextColor={color.text.tertiary}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>数量</Text>
              <TextInput
                style={styles.input}
                value={form.shares}
                onChangeText={(v) => setForm({ ...form, shares: v })}
                placeholder="持有股数"
                placeholderTextColor={color.text.tertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>成本价</Text>
              <TextInput
                style={styles.input}
                value={form.costBasisPerShare}
                onChangeText={(v) => setForm({ ...form, costBasisPerShare: v })}
                placeholder="每股成本"
                placeholderTextColor={color.text.tertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>币种</Text>
              <View style={styles.currencyRow}>
                {['USD', 'HKD', 'CNY'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.currencyBtn, form.currency === c && styles.currencyBtnActive]}
                    onPress={() => setForm({ ...form, currency: c })}
                  >
                    <Text style={[
                      styles.currencyBtnText,
                      form.currency === c && styles.currencyBtnTextActive,
                    ]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>行业</Text>
              <View style={styles.sectorWrap}>
                {SECTOR_OPTIONS.map((opt) => {
                  const active = (form.sector || (form.symbol ? getSector(form.symbol.trim().toUpperCase()) : '')) === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.sectorChip, active && styles.sectorChipActive]}
                      onPress={() => setForm({ ...form, sector: opt.value })}
                    >
                      <Text style={[
                        styles.sectorChipText,
                        active && styles.sectorChipTextActive,
                      ]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: color.bg.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: '90%',
  },
  title: {
    ...font.h1,
    color: color.text.primary,
    marginBottom: spacing.lg,
  },
  row: { marginBottom: spacing.md },
  label: { ...font.caption, color: color.text.secondary, marginBottom: 6 },
  input: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: font.body.fontSize,
    color: color.text.primary,
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
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: color.bg.subtle,
    alignItems: 'center',
  },
  cancelText: { ...font.body, color: color.text.secondary },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: color.brand.primary,
    alignItems: 'center',
  },
  saveText: { ...font.body, color: color.text.onPrimary },
});
