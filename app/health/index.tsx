import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { usePortfolio } from '../../src/hooks/use-portfolio';
import { useHealthScore } from '../../src/hooks/use-health-score';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Card } from '../../src/components/ui/Card';
import { MetricRow } from '../../src/components/ui/MetricRow';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function HealthScreen() {
  const { holdings, prices, summary } = usePortfolio();
  const { score, isLoading } = useHealthScore(holdings, prices);

  if (holdings.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="暂无健康度数据"
          description="导入持仓后将自动计算组合健康度评分"
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>计算中...</Text>
      </View>
    );
  }

  const getScoreColor = (s: number) =>
    s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overall Score */}
      <Card style={styles.scoreCard}>
        <ProgressBar score={score.overall} size={120} showLabel />
        <Text style={styles.scoreDescription}>
          {score.overall >= 70
            ? '组合状态良好，继续保持'
            : score.overall >= 40
              ? '存在部分风险，建议关注'
              : '风险较高，建议调整持仓'}
        </Text>
      </Card>

      {/* Sub-scores */}
      <View style={styles.grid}>
        <SubScoreCard
          title="集中度"
          score={score.components.concentration}
          description={
            score.components.concentration >= 70
              ? '分散合理'
              : score.components.concentration >= 40
                ? '集中度偏高'
                : '单一持仓过重'
          }
          icon="🎯"
        />
        <SubScoreCard
          title="行业分散"
          score={score.components.diversification}
          description={
            score.components.diversification >= 70
              ? '行业覆盖良好'
              : score.components.diversification >= 40
                ? '行业集中偏高'
                : '行业过于单一'
          }
          icon="📊"
        />
        <SubScoreCard
          title="波动率"
          score={score.components.volatility}
          description={
            score.components.volatility >= 70
              ? '波动适中'
              : score.components.volatility >= 40
                ? '波动偏高'
                : '高风险组合'
          }
          icon="📈"
        />
        <SubScoreCard
          title="回撤"
          score={score.components.drawdown}
          description={
            score.components.drawdown >= 70
              ? summary?.totalPnLPercent !== undefined && summary?.totalPnLPercent >= 0
                ? '整体盈利'
                : '小幅浮亏'
              : '浮亏较大'
          }
          icon="📉"
        />
      </View>

      {/* Alerts */}
      {score.alerts.length > 0 && (
        <Card style={styles.alertCard}>
          <Text style={styles.alertTitle}>风险提示</Text>
          {score.alerts.map((alert, i) => (
            <View key={i} style={styles.alertItem}>
              <Text style={styles.alertDot}>•</Text>
              <Text style={styles.alertText}>{alert}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Suggestions */}
      <Card>
        <Text style={styles.suggestionTitle}>改进建议</Text>
        {score.components.concentration < 60 && (
          <Text style={styles.suggestion}>
            • 降低最高持仓权重至 20% 以下，可提升集中度分数
          </Text>
        )}
        {score.components.diversification < 60 && (
          <Text style={styles.suggestion}>
            • 增加不同行业的股票，建议覆盖 4 个以上行业
          </Text>
        )}
        {score.components.volatility < 60 && (
          <Text style={styles.suggestion}>
            • 考虑加入低波动资产（如公用事业、消费必需品）平衡风险
          </Text>
        )}
        {score.components.drawdown < 60 && (
          <Text style={styles.suggestion}>
            • 浮亏较大，建议审视基本面是否发生变化
          </Text>
        )}
        {score.overall >= 70 && (
          <Text style={styles.suggestion}>
            • 组合状态良好，暂无需要特别调整的地方
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

function SubScoreCard({
  title,
  score,
  description,
  icon,
}: {
  title: string;
  score: number;
  description: string;
  icon: string;
}) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <View style={styles.subScoreCard}>
      <Text style={styles.subScoreIcon}>{icon}</Text>
      <Text style={styles.subScoreTitle}>{title}</Text>
      <Text style={[styles.subScoreValue, { color }]}>{score}</Text>
      <Text style={styles.subScoreDesc}>{description}</Text>
    </View>
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
  loading: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 80,
  },
  scoreCard: {
    alignItems: 'center',
    padding: 24,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subScoreCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  subScoreIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  subScoreTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  subScoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  subScoreDesc: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderWidth: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A3412',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  alertDot: {
    fontSize: 14,
    color: '#EA580C',
    marginRight: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#9A3412',
    lineHeight: 18,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  suggestion: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 4,
  },
});
