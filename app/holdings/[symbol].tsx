import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePortfolio } from '../../src/hooks/use-portfolio';
import { Card } from '../../src/components/ui/Card';
import { MetricRow } from '../../src/components/ui/MetricRow';
import { HoldingFormModal } from '../../src/components/portfolio/HoldingFormModal';
import { formatCurrency, formatPercent } from '../../src/utils/formatters';
import { color, spacing, font, radius, semantic } from '../../src/theme/tokens';
import { getSectorZH } from '../../src/data/sector-map';
import { upsertHolding, deleteHolding } from '../../src/data/storage';
import { Holding } from '../../src/domain/types';

export default function HoldingDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const { details, loadData } = usePortfolio();
  const [showEdit, setShowEdit] = React.useState(false);
  const detail = details.find(
    (d) => d.holding.symbol === decodeURIComponent(symbol || '')
  );

  const handleSave = async (h: Holding) => {
    await upsertHolding(h);
    await loadData();
  };

  const handleDelete = () => {
    if (!detail) return;
    Alert.alert('确认删除', `删除 ${detail.holding.symbol}?`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteHolding(detail.holding.id);
          await loadData();
          router.back();
        },
      },
    ]);
  };

  if (!detail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <NavBar onBack={() => router.back()} title="持仓详情" />
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFound}>未找到该持仓</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isUp = detail.pnl >= 0;
  const isDayUp = detail.dayChangePercent >= 0;
  const sectorLabel = getSectorZH(detail.holding.symbol);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NavBar
        onBack={() => router.back()}
        title={detail.holding.symbol}
        onEdit={() => setShowEdit(true)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroSymbol}>{detail.holding.symbol}</Text>
            <View style={styles.sectorChip}>
              <Text style={styles.sectorChipText}>{sectorLabel}</Text>
            </View>
          </View>
          <Text style={styles.heroName} numberOfLines={1}>{detail.holding.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.heroPrice}>
              {formatCurrency(detail.currentPrice, detail.holding.currency)}
            </Text>
            <View style={[styles.dayChangePill, isDayUp ? styles.pillUp : styles.pillDown]}>
              <Text style={[styles.dayChangeText, isDayUp ? styles.textUp : styles.textDown]}>
                {isDayUp ? '+' : ''}{detail.dayChangePercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Cost vs Current */}
        <Card>
          <MetricRow
            label="成本价"
            value={formatCurrency(detail.holding.costBasisPerShare, detail.holding.currency)}
          />
          <MetricRow
            label="当前价"
            value={formatCurrency(detail.currentPrice, detail.holding.currency)}
            trend={formatPercent(detail.pnlPercent)}
            trendUp={isUp}
          />
          <MetricRow
            label="持仓数量"
            value={detail.holding.shares.toFixed(detail.holding.shares % 1 === 0 ? 0 : 2)}
          />
        </Card>

        {/* P&L */}
        <Card style={styles.card}>
          <MetricRow
            label="持仓市值"
            value={formatCurrency(detail.value, detail.holding.currency)}
          />
          <MetricRow
            label="持仓成本"
            value={formatCurrency(detail.cost, detail.holding.currency)}
          />
          <MetricRow
            label="盈亏金额"
            value={formatCurrency(detail.pnl, detail.holding.currency, { noDecimals: true })}
            trend={formatPercent(detail.pnlPercent)}
            trendUp={isUp}
          />
          <MetricRow
            label="组合权重"
            value={`${detail.weight.toFixed(1)}%`}
          />
        </Card>

        {/* Info */}
        <Card style={styles.card}>
          <MetricRow label="行业" value={sectorLabel} />
          <MetricRow
            label="导入时间"
            value={new Date(detail.holding.importedAt).toLocaleDateString('zh-CN')}
          />
        </Card>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
            <Text style={styles.editBtnText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>删除</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <HoldingFormModal
        visible={showEdit}
        initial={detail.holding}
        onClose={() => setShowEdit(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

function NavBar({ onBack, title, onEdit }: { onBack: () => void; title: string; onEdit?: () => void }) {
  return (
    <View style={styles.navBar}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.editIconBtn, pressed && { opacity: 0.5 }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.editIconText}>编辑</Text>
        </Pressable>
      ) : (
        <View style={styles.navPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg.app,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 44,
    backgroundColor: color.bg.app,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: color.text.primary,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },
  navTitle: {
    fontSize: font.body.fontSize,
    fontWeight: '600',
    color: color.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  navPlaceholder: { width: 40, height: 40 },
  editIconBtn: {
    height: 40,
    minWidth: 40,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  editIconText: {
    fontSize: 15,
    color: color.brand.primary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: color.brand.primary,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: color.text.onPrimary,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: color.bg.card,
    borderWidth: 1,
    borderColor: color.brand.danger,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: color.brand.danger,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    paddingTop: 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  heroSymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: color.text.primary,
    letterSpacing: -0.5,
  },
  sectorChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#EEF4FF',
    borderRadius: radius.sm,
  },
  sectorChipText: {
    fontSize: 11,
    color: '#4361EE',
    fontWeight: '600',
  },
  heroName: {
    fontSize: font.body.fontSize,
    color: color.text.secondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroPrice: {
    fontSize: 30,
    fontWeight: '700',
    color: color.text.primary,
    letterSpacing: -0.3,
  },
  dayChangePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  pillUp: { backgroundColor: '#E8F8EF' },
  pillDown: { backgroundColor: '#FCEDED' },
  dayChangeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  textUp: { color: color.brand.primary },
  textDown: { color: color.brand.danger },
  card: { marginTop: 0 },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: 15,
    color: color.text.tertiary,
  },
});
