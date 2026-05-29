import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { usePortfolio } from '../src/hooks/use-portfolio';
import { useHealthScore } from '../src/hooks/use-health-score';
import { EmptyState } from '../src/components/ui/EmptyState';
import { formatCurrency, formatPercent } from '../src/utils/formatters';
import { getRandomTip } from '../src/utils/tips';
import { analyzePortfolio } from '../src/data/ai-service';
import { useRouter, useFocusEffect } from 'expo-router';
import { color } from '../src/theme/tokens';

const THINKING_PHRASES = [
  '正在深度思考中…',
  '调取持仓最新数据…',
  '快马加鞭指挥 AI…',
  '扫描全球市场动态…',
  '计算最优策略中…',
  '锁定关键风险点…',
  '整理大佬级建议…',
];

export default function HomeScreen() {
  const router = useRouter();
  const { holdings, prices, summary, details, isLoading, refresh, loadData } = usePortfolio();
  const { score } = useHealthScore(holdings, prices);
  const [refreshing, setRefreshing] = React.useState(false);
  const [tip] = React.useState(getRandomTip);

  // 每次页面获得焦点时重新加载数据（导入后自动刷新）
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );
  const [aiInsight, setAiInsight] = React.useState<{
    summary: string;
    suggestions: string[];
    sentiment: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [thinkingIdx, setThinkingIdx] = React.useState(0);
  const phraseOpacity = React.useRef(new Animated.Value(1)).current;

  // 轮播文案：每 1.8s 切换 + 短暂淡入
  React.useEffect(() => {
    if (!aiLoading) return;
    setThinkingIdx(0);
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(phraseOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(phraseOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setThinkingIdx((i) => (i + 1) % THINKING_PHRASES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [aiLoading, phraseOpacity]);

  const triggerAI = React.useCallback(async () => {
    if (holdings.length === 0 || aiLoading) return;
    setAiInsight(null); // 立即清空旧分析，让用户感知刷新生效
    setAiLoading(true);
    try {
      const result = await analyzePortfolio(holdings, prices, score);
      setAiInsight(result);
    } catch (e) {
      // 静默失败：保留 null，UI 显示「刷新」让用户重试
    } finally {
      setAiLoading(false);
    }
  }, [holdings, prices, score, aiLoading]);

  React.useEffect(() => {
    if (holdings.length > 0 && !aiInsight) {
      triggerAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings.length]);

  // 下拉刷新：只刷新行情，AI 解耦由用户主动触发
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  if (!summary) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="开始你的暴富之路"
          description="导入持仓数据，见证你的财富帝国"
          actionLabel="导入持仓"
          onAction={() => router.push('/import')}
        />
      </View>
    );
  }

  const pnlPositive = summary.totalPnL >= 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.brand.primary} />}
    >
      {/* Fun Tip */}
      <View style={styles.tipBar}>
        <Text style={styles.tipText}>{tip}</Text>
      </View>

      {/* Hero: Total Value */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>投资总值</Text>
        <Text style={styles.heroValue}>{formatCurrency(summary.totalValue)}</Text>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}>
            <Text style={styles.metricLabel}>总盈亏</Text>
            <Text style={[styles.metricValue, pnlPositive ? styles.profit : styles.loss]}>
              {pnlPositive ? '+' : ''}{formatCurrency(summary.totalPnL)}
            </Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroMetric}>
            <Text style={styles.metricLabel}>收益率</Text>
            <Text style={[styles.metricValue, pnlPositive ? styles.profit : styles.loss]}>
              {formatPercent(summary.totalPnLPercent)}
            </Text>
          </View>
        </View>
      </View>

      {/* AI Insight Card */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiTitle}>AI 智能分析</Text>
          <TouchableOpacity
            style={[styles.aiRefreshBtn, aiLoading && styles.aiRefreshBtnDisabled]}
            onPress={triggerAI}
            disabled={aiLoading}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.aiRefreshText, aiLoading && styles.aiRefreshTextDisabled]}>
              {aiLoading ? '分析中' : '刷新'}
            </Text>
          </TouchableOpacity>
        </View>
        {aiLoading ? (
          <View style={styles.aiThinking}>
            <Animated.Text style={[styles.aiThinkingText, { opacity: phraseOpacity }]}>
              {THINKING_PHRASES[thinkingIdx]}
            </Animated.Text>
            <ActivityIndicator size="small" color={color.brand.primary} style={{ marginTop: 10 }} />
          </View>
        ) : aiInsight ? (
          <>
            <Text style={styles.aiSummary}>{aiInsight.summary}</Text>
            {aiInsight.suggestions.map((s, i) => (
              <Text key={i} style={styles.aiSuggestion}>• {s}</Text>
            ))}
          </>
        ) : (
          <Text style={styles.aiPlaceholder}>点击右上角「刷新」获取 AI 分析</Text>
        )}
      </View>

      {/* Top Holdings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>持仓明细</Text>
        </View>
        {details.slice(0, 5).map((d) => (
          <TouchableOpacity
            key={d.holding.id}
            style={styles.stockRow}
            activeOpacity={0.6}
            onPress={() => router.push(`/holdings/${encodeURIComponent(d.holding.symbol)}`)}
          >
            <View style={styles.stockLeft}>
              <Text style={styles.stockSymbol}>{d.holding.symbol}</Text>
              <Text style={styles.stockName} numberOfLines={1}>{d.holding.name}</Text>
            </View>
            <View style={styles.stockRight}>
              <Text style={styles.stockValue}>{formatCurrency(d.value, d.holding.currency)}</Text>
              <View style={[styles.changePill, d.pnl >= 0 ? styles.pillProfit : styles.pillLoss]}>
                <Text style={[styles.changePillText, d.pnl >= 0 ? styles.profit : styles.loss]}>
                  {d.pnl >= 0 ? '+' : ''}{d.pnlPercent.toFixed(1)}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFE' },
  content: { paddingBottom: 32 },
  tipBar: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#00C851',
  },
  tipText: { fontSize: 13, color: '#2D6A4F', fontWeight: '500', lineHeight: 18 },
  heroCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#00C851',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  heroLabel: { fontSize: 13, color: '#8E8EA0', fontWeight: '500' },
  heroValue: { fontSize: 34, fontWeight: '800', color: '#1A1A2E', marginTop: 4, letterSpacing: -0.5 },
  heroMetrics: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  heroMetric: { flex: 1, alignItems: 'center' },
  heroDivider: { width: 1, height: 28, backgroundColor: '#F0F0F5' },
  metricLabel: { fontSize: 11, color: '#8E8EA0', marginBottom: 4 },
  metricValue: { fontSize: 15, fontWeight: '700' },
  profit: { color: '#00C851' },
  loss: { color: '#FF5252' },
  aiCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  aiTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  aiRefreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#00C85114',
  },
  aiRefreshBtnDisabled: { backgroundColor: '#E8E8EE' },
  aiRefreshText: { fontSize: 12, fontWeight: '700', color: '#00C851' },
  aiRefreshTextDisabled: { color: '#8E8EA0' },
  aiThinking: { paddingVertical: 16, alignItems: 'center' },
  aiThinkingText: { fontSize: 13, color: '#00A246', fontWeight: '600', letterSpacing: 0.2 },
  aiSummary: { fontSize: 13, color: '#333', lineHeight: 20, marginBottom: 8 },
  aiSuggestion: { fontSize: 12, color: '#555', lineHeight: 18, marginBottom: 3 },
  aiPlaceholder: { fontSize: 13, color: '#8E8EA0', fontStyle: 'italic' },
  section: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5FA',
  },
  stockLeft: { flex: 1 },
  stockSymbol: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  stockName: { fontSize: 12, color: '#8E8EA0', marginTop: 2, maxWidth: 140 },
  stockRight: { alignItems: 'flex-end', gap: 4 },
  stockValue: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  changePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillProfit: { backgroundColor: '#00C85112' },
  pillLoss: { backgroundColor: '#FF525212' },
  changePillText: { fontSize: 12, fontWeight: '700' },
});
