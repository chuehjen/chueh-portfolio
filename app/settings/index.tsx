// 设置页 — iOS 风格分组卡片，遵循 DESIGN_SYSTEM tokens
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDailySync } from '../../src/hooks/use-daily-sync';
import { usePortfolio } from '../../src/hooks/use-portfolio';
import { clearAllHoldings } from '../../src/data/storage';
import { formatLastUpdate } from '../../src/utils/formatters';
import { color, spacing, radius, font, shadow } from '../../src/theme/tokens';

export default function SettingsScreen() {
  const { lastSync, syncInProgress, triggerSync } = useDailySync();
  const { holdings, loadData } = usePortfolio();

  const handleClearData = () => {
    Alert.alert(
      '清除所有数据',
      '这将删除所有持仓和价格记录，无法恢复',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: async () => {
            await clearAllHoldings();
            await loadData();
            Alert.alert('已清除', '所有数据已清除');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* —— 数据同步 —— */}
      <Text style={styles.groupHeader}>数据同步</Text>
      <View style={styles.group}>
        <Row label="上次同步" value={formatLastUpdate(lastSync)} divider />
        <Row label="数据源" value="Yahoo Finance" divider />
        <Row label="持仓数量" value={`${holdings.length} 只`} />
      </View>
      <TouchableOpacity
        style={[styles.primaryBtn, syncInProgress && styles.primaryBtnDisabled]}
        onPress={triggerSync}
        disabled={syncInProgress}
        activeOpacity={0.85}
      >
        {syncInProgress ? (
          <View style={styles.btnInline}>
            <ActivityIndicator size="small" color={color.text.onPrimary} />
            <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>同步中…</Text>
          </View>
        ) : (
          <Text style={styles.primaryBtnText}>立即同步行情</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.groupFooter}>
        下拉持仓页可手动刷新；进入应用每日自动同步一次
      </Text>

      {/* —— 关于 —— */}
      <Text style={styles.groupHeader}>关于</Text>
      <View style={styles.group}>
        <Row label="版本" value="1.0.0" divider />
        <Row label="开发者" value="chuehjen" />
      </View>

      {/* —— 危险操作 —— */}
      <Text style={[styles.groupHeader, styles.groupHeaderDanger]}>危险操作</Text>
      <TouchableOpacity
        style={styles.dangerBtn}
        onPress={handleClearData}
        activeOpacity={0.85}
      >
        <Text style={styles.dangerBtnText}>清除所有持仓与价格记录</Text>
      </TouchableOpacity>
      <Text style={styles.groupFooter}>不可恢复，请谨慎操作</Text>
    </ScrollView>
  );
}

interface RowProps {
  label: string;
  value: string;
  divider?: boolean;
}
function Row({ label, value, divider }: RowProps) {
  return (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg.app,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },

  // Group
  groupHeader: {
    ...font.tiny,
    color: color.text.tertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  groupHeaderDanger: {
    color: color.brand.danger,
  },
  group: {
    backgroundColor: color.bg.card,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  groupFooter: {
    ...font.tiny,
    color: color.text.tertiary,
    fontWeight: '500',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    lineHeight: 16,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border.default,
  },
  rowLabel: {
    ...font.body,
    color: color.text.primary,
    fontWeight: '500',
  },
  rowValue: {
    ...font.body,
    color: color.text.secondary,
    fontWeight: '500',
    maxWidth: '60%',
  },

  // Buttons
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: color.brand.primary,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: color.text.tertiary,
  },
  primaryBtnText: {
    ...font.body,
    color: color.text.onPrimary,
    fontWeight: '700',
  },
  btnInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dangerBtn: {
    backgroundColor: color.bg.card,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.brand.dangerSoft,
  },
  dangerBtnText: {
    ...font.body,
    color: color.brand.danger,
    fontWeight: '700',
  },
});
