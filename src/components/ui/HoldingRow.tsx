import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface Props {
  symbol: string;
  name: string;
  value: number;
  pnl: number;
  pnlPercent: number;
  dayChangePercent: number;
  weight: number;
  currency?: string;
  onPress?: () => void;
}

export function HoldingRow({
  symbol,
  name,
  value,
  pnl,
  pnlPercent,
  dayChangePercent,
  weight,
  currency = 'USD',
  onPress,
}: Props) {
  const isUp = pnl >= 0;
  const dayUp = dayChangePercent >= 0;

  const wrapper = onPress ? (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <HoldingContent symbol={symbol} name={name} value={value} pnl={pnl} pnlPercent={pnlPercent} dayChangePercent={dayChangePercent} weight={weight} currency={currency} isUp={isUp} dayUp={dayUp} />
    </TouchableOpacity>
  ) : (
    <View style={styles.row}>
      <HoldingContent symbol={symbol} name={name} value={value} pnl={pnl} pnlPercent={pnlPercent} dayChangePercent={dayChangePercent} weight={weight} currency={currency} isUp={isUp} dayUp={dayUp} />
    </View>
  );

  return wrapper;
}

function HoldingContent({
  symbol,
  name,
  value,
  pnlPercent,
  dayChangePercent,
  weight,
  currency,
  isUp,
  dayUp,
}: Props & { isUp: boolean; dayUp: boolean }) {
  return (
    <>
      <View style={styles.left}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.weight}>{weight.toFixed(1)}%</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.value}>{formatCurrency(value, currency)}</Text>
        <Text
          style={[
            styles.change,
            isUp ? styles.changeUp : styles.changeDown,
          ]}
        >
          {formatPercent(pnlPercent)}
        </Text>
        <Text
          style={[
            styles.dayChange,
            dayUp ? styles.changeUp : styles.changeDown,
          ]}
        >
          {dayUp ? '▲' : '▼'} {Math.abs(dayChangePercent).toFixed(1)}%
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  name: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    maxWidth: 140,
  },
  weight: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  change: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  dayChange: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  changeUp: {
    color: '#10B981',
  },
  changeDown: {
    color: '#EF4444',
  },
});
