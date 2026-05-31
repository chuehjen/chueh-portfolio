// HoldingRow — 持仓行组件 V2
// 布局：左 [symbol+name+AI标签+行业] | 中 [现价+市值] | 右 [损益金额+收益率药丸]

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HoldingWithDetails } from '../../domain/portfolio-calculator';
import { formatCurrency } from '../../utils/formatters';
import { getSectorZH } from '../../data/sector-map';
import { color, spacing, radius, font, shadow, semantic } from '../../theme/tokens';

interface Props {
  item: HoldingWithDetails;
  aiTag?: { label: string; confidence: number } | null;
  onPress: (h: HoldingWithDetails) => void;
}

export function HoldingRow({ item, aiTag, onPress }: Props) {
  const { holding, currentPrice, value, pnl, pnlPercent } = item;
  const pnlColor = semantic.pnlColor(pnl);
  const pillBg = semantic.pnlPillBg(pnl);
  const sectorZH = getSectorZH(holding.symbol);

  // 日涨跌色（基于 dayChange）
  const dayColor = semantic.pnlColor(item.dayChange);

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={() => onPress(item)}>
      {/* Left: 代码+名称+标签 */}
      <View style={styles.left}>
        <Text style={styles.symbol} numberOfLines={1}>{holding.symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>{holding.name}</Text>
        {(aiTag || sectorZH !== '其他') && (
          <View style={styles.tagRow}>
            {aiTag && (
              <Text style={styles.aiTagText} numberOfLines={1}>
                {aiTag.label}
                <Text style={styles.aiConfText}> {aiTag.confidence}%</Text>
              </Text>
            )}
            {aiTag && sectorZH !== '其他' && <Text style={styles.tagDot}> · </Text>}
            {sectorZH !== '其他' && (
              <Text style={styles.sectorText} numberOfLines={1}>{sectorZH}</Text>
            )}
          </View>
        )}
      </View>

      {/* Center: 现价 + 市值 */}
      <View style={styles.center}>
        <Text style={[styles.priceText, { color: dayColor }]} numberOfLines={1}>
          {formatCurrency(currentPrice, holding.currency)}
        </Text>
        <Text style={styles.valueLabel} numberOfLines={1}>
          市值 {formatCurrency(value, holding.currency)}
        </Text>
      </View>

      {/* Right: 总损益 + 收益率药丸 */}
      <View style={styles.right}>
        <Text style={[styles.pnlAmount, { color: pnlColor }]} numberOfLines={1}>
          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl, holding.currency, { noDecimals: true })}
        </Text>
        <View style={[styles.pill, { backgroundColor: pillBg }]}>
          <Text style={[styles.pillText, { color: pnlColor }]}>
            {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: color.bg.card,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  left: { flex: 1.1, paddingRight: spacing.sm },
  symbol: { ...font.body, color: color.text.primary, ...semantic.numberStyle },
  name: { ...font.tiny, color: color.text.secondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  aiTagText: { ...font.tiny, color: color.brand.primary, fontWeight: '700' },
  aiConfText: { ...font.tiny, color: color.text.tertiary, fontWeight: '500' },
  tagDot: { ...font.tiny, color: color.text.tertiary },
  sectorText: { ...font.tiny, color: color.text.tertiary, fontWeight: '500' },

  center: { flex: 1, alignItems: 'flex-end', paddingRight: spacing.md },
  priceText: { ...font.body, fontWeight: '700', ...semantic.numberStyle },
  valueLabel: { ...font.tiny, color: color.text.tertiary, marginTop: 3 },

  right: { flex: 0.9, alignItems: 'flex-end' },
  pnlAmount: { ...font.body, fontWeight: '700', ...semantic.numberStyle },
  pill: {
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pillText: { ...font.tag, ...semantic.numberStyle },
});
