import React, { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { usePortfolio } from '../../src/hooks/use-portfolio';
import { Card } from '../../src/components/ui/Card';
import { MetricRow } from '../../src/components/ui/MetricRow';
import { formatCurrency, formatPercent } from '../../src/utils/formatters';

export default function HoldingDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const { details } = usePortfolio();
  const detail = details.find(
    (d) => d.holding.symbol === decodeURIComponent(symbol || '')
  );

  if (!detail) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>未找到该持仓</Text>
      </View>
    );
  }

  const isUp = detail.pnl >= 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.symbol}>{detail.holding.symbol}</Text>
        <Text style={styles.name}>{detail.holding.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatCurrency(detail.currentPrice, detail.holding.currency)}
          </Text>
          <Text
            style={[
              styles.dayChange,
              isUp ? styles.up : styles.down,
            ]}
          >
            {formatPercent(detail.pnlPercent)}
          </Text>
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
          value={formatCurrency(detail.pnl, detail.holding.currency)}
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
        <MetricRow
          label="行业"
          value={detail.holding.sector}
        />
        <MetricRow
          label="今日涨跌"
          value={`${detail.dayChangePercent >= 0 ? '+' : ''}${detail.dayChangePercent.toFixed(2)}%`}
          trend={detail.dayChangePercent >= 0 ? '▲' : '▼'}
          trendUp={detail.dayChangePercent >= 0}
        />
        <MetricRow
          label="导入时间"
          value={new Date(detail.holding.importedAt).toLocaleDateString('zh-CN')}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  symbol: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  name: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  dayChange: {
    fontSize: 16,
    fontWeight: '600',
  },
  up: {
    color: '#10B981',
  },
  down: {
    color: '#EF4444',
  },
  card: {
    marginTop: 0,
  },
  notFound: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 80,
  },
});
