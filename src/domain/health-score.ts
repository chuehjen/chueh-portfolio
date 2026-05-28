import {
  Holding,
  PriceSnapshot,
  DailyPortfolioSnapshot,
  HealthScoreResult,
  HealthScoreComponents,
} from '../domain/types';
import { HEALTH_WEIGHTS, SECTOR_BETA } from '../utils/constants';

export function calculateHealthScore(
  holdings: Holding[],
  prices: Map<string, PriceSnapshot>,
  historicalSnapshots: DailyPortfolioSnapshot[]
): HealthScoreResult {
  const alerts: string[] = [];

  if (holdings.length === 0) {
    return {
      overall: 0,
      components: {
        concentration: 0,
        diversification: 0,
        volatility: 0,
        drawdown: 0,
        overall: 0,
      },
      alerts: ['请先导入持仓数据'],
      trends: { score7d: null, score30d: null, direction: 'stable' },
    };
  }

  const holdingValues = holdings.map((h) => {
    const price = prices.get(h.symbol)?.price || h.costBasisPerShare;
    return { ...h, currentPrice: price, value: h.shares * price };
  });

  const totalValue = holdingValues.reduce((s, h) => s + h.value, 0);
  const totalCost = holdingValues.reduce(
    (s, h) => s + h.shares * h.costBasisPerShare,
    0
  );

  const concentration = scoreConcentration(holdingValues, totalValue, alerts);
  const diversification = scoreDiversification(holdingValues, totalValue, alerts);
  const volatility = scoreVolatility(holdingValues, totalValue);
  const drawdown = scoreDrawdown(totalValue, totalCost, alerts);

  const overall =
    concentration * HEALTH_WEIGHTS.concentration +
    diversification * HEALTH_WEIGHTS.diversification +
    volatility * HEALTH_WEIGHTS.volatility +
    drawdown * HEALTH_WEIGHTS.drawdown;

  const components: HealthScoreComponents = {
    concentration,
    diversification,
    volatility,
    drawdown,
    overall: Math.round(overall),
  };

  const trends = calculateTrends(historicalSnapshots);

  return {
    overall: Math.max(0, Math.min(100, Math.round(overall))),
    components,
    alerts,
    trends,
  };
}

function scoreConcentration(
  holdings: { value: number; symbol: string }[],
  totalValue: number,
  alerts: string[]
): number {
  const sorted = [...holdings].sort((a, b) => b.value - a.value);
  const topWeight = sorted[0]?.value / totalValue || 0;

  let baseScore: number;
  if (topWeight > 0.5) {
    baseScore = 20;
    alerts.push(`最高持仓 ${sorted[0]?.symbol} 占比 ${Math.round(topWeight * 100)}%，集中度风险较高`);
  } else if (topWeight > 0.3) {
    baseScore = 50;
    alerts.push(`最高持仓 ${sorted[0]?.symbol} 占比 ${Math.round(topWeight * 100)}%，建议降低单一持仓权重`);
  } else if (topWeight > 0.2) {
    baseScore = 75;
  } else {
    baseScore = 100;
  }

  const top3Weight = sorted.slice(0, 3).reduce((s, h) => s + h.value, 0) / totalValue;
  let penalty = 0;
  if (top3Weight > 0.8) {
    penalty = -20;
    alerts.push('前三大持仓占比超过 80%，分散度不足');
  } else if (top3Weight > 0.6) {
    penalty = -10;
  }

  return Math.max(0, Math.min(100, baseScore + penalty));
}

function scoreDiversification(
  holdings: { sector: string; value: number }[],
  totalValue: number,
  alerts: string[]
): number {
  const sectorWeights = new Map<string, number>();
  for (const h of holdings) {
    const current = sectorWeights.get(h.sector) || 0;
    sectorWeights.set(h.sector, current + h.value);
  }

  const numSectors = sectorWeights.size;
  const unknownCount = sectorWeights.get('Unknown') || 0;
  const unknownRatio = unknownCount / totalValue;

  let score: number;
  if (numSectors <= 1) score = 25;
  else if (numSectors === 2) score = 50;
  else if (numSectors === 3) score = 70;
  else if (numSectors === 4) score = 85;
  else score = 100;

  if (unknownRatio > 0.3) {
    score -= 10;
    alerts.push(`${Math.round(unknownRatio * 100)}% 的持仓行业未知，建议补充行业信息`);
  }

  const maxSectorWeight = Math.max(...Array.from(sectorWeights.values())) / totalValue;
  if (maxSectorWeight > 0.6) {
    score -= 15;
    alerts.push('单一行业占比超过 60%，行业集中风险较高');
  } else if (maxSectorWeight > 0.4) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreVolatility(
  holdings: { sector: string; value: number }[],
  totalValue: number
): number {
  let portfolioBeta = 0;
  for (const h of holdings) {
    const weight = h.value / totalValue;
    const beta = SECTOR_BETA[h.sector] ?? 1.0;
    portfolioBeta += weight * beta;
  }

  const deviation = Math.abs(portfolioBeta - 1.0);
  if (deviation < 0.2) return 100;
  if (deviation < 0.5) return 75;
  if (deviation < 0.8) return 50;
  return 25;
}

function scoreDrawdown(
  totalValue: number,
  totalCost: number,
  alerts: string[]
): number {
  if (totalCost === 0) return 100;

  const drawdownPercent = (totalValue - totalCost) / totalCost;

  if (drawdownPercent >= 0) return 100;
  if (drawdownPercent > -0.05) return 85;
  if (drawdownPercent > -0.1) return 70;
  if (drawdownPercent > -0.2) return 50;
  if (drawdownPercent > -0.3) {
    alerts.push('组合浮亏超过 20%，建议审视持仓策略');
    return 30;
  }
  alerts.push('组合浮亏超过 30%，风险较高');
  return 10;
}

function calculateTrends(
  snapshots: DailyPortfolioSnapshot[]
): { score7d: number | null; score30d: number | null; direction: 'improving' | 'declining' | 'stable' } {
  if (snapshots.length < 2) {
    return { score7d: null, score30d: null, direction: 'stable' };
  }

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const weekAgo = sorted.length >= 7 ? sorted[sorted.length - 7] : sorted[0];
  const monthAgo = sorted.length >= 30 ? sorted[sorted.length - 30] : sorted[0];

  const direction =
    latest.healthScore > weekAgo.healthScore + 3
      ? 'improving'
      : latest.healthScore < weekAgo.healthScore - 3
        ? 'declining'
        : 'stable';

  return {
    score7d: weekAgo.healthScore,
    score30d: monthAgo.healthScore,
    direction,
  };
}
