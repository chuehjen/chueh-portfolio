import { Holding, PriceSnapshot, DailyPortfolioSnapshot } from '../domain/types';
import { calculatePortfolioSummary, calculateHoldingDetails } from '../domain/portfolio-calculator';
import { formatCurrency, formatPercent } from '../utils/formatters';

export interface PortfolioContext {
  summary: {
    totalValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    holdingCount: number;
    healthScore: number;
    lastUpdated: string;
  };
  holdings: Array<{
    symbol: string;
    name: string;
    shares: number;
    costBasis: number;
    currentPrice: number;
    pnlPercent: number;
    weight: number;
    sector: string;
  }>;
  health: {
    overall: number;
    concentration: number;
    diversification: number;
    volatility: number;
    drawdown: number;
    alerts: string[];
  };
  trend: {
    score7d: number | null;
    value7d: number | null;
    direction: string;
  };
}

export function buildPortfolioContext(
  holdings: Holding[],
  prices: Map<string, PriceSnapshot>,
  healthScore: number,
  healthComponents: { concentration: number; diversification: number; volatility: number; drawdown: number },
  healthAlerts: string[],
  trends: { score7d: number | null; score30d: number | null; direction: string },
  snapshots: DailyPortfolioSnapshot[]
): PortfolioContext {
  const summary = calculatePortfolioSummary(holdings, prices);
  const details = calculateHoldingDetails(holdings, prices, summary.totalValue);

  return {
    summary: {
      totalValue: summary.totalValue,
      totalPnL: summary.totalPnL,
      totalPnLPercent: summary.totalPnLPercent,
      holdingCount: holdings.length,
      healthScore,
      lastUpdated: new Date().toISOString(),
    },
    holdings: details.map((d) => ({
      symbol: d.holding.symbol,
      name: d.holding.name,
      shares: d.holding.shares,
      costBasis: d.holding.costBasisPerShare,
      currentPrice: d.currentPrice,
      pnlPercent: d.pnlPercent,
      weight: d.weight,
      sector: d.holding.sector,
    })),
    health: {
      overall: healthScore,
      concentration: healthComponents.concentration,
      diversification: healthComponents.diversification,
      volatility: healthComponents.volatility,
      drawdown: healthComponents.drawdown,
      alerts: healthAlerts,
    },
    trend: {
      score7d: trends.score7d,
      value7d: snapshots.length >= 7 ? snapshots[snapshots.length - 7]?.totalValue ?? null : null,
      direction: trends.direction,
    },
  };
}

export function formatContextForPrompt(context: PortfolioContext): string {
  const lines: string[] = [];

  lines.push(`Portfolio Summary (as of ${context.summary.lastUpdated.split('T')[0]}):`);
  lines.push(
    `- Total Value: ${formatCurrency(context.summary.totalValue)} | P&L: ${formatCurrency(context.summary.totalPnL)} (${formatPercent(context.summary.totalPnLPercent)}) | Health: ${context.summary.healthScore}/100`
  );
  lines.push(`- Holdings: ${context.summary.holdingCount} stocks`);
  lines.push('');

  lines.push('Top Holdings:');
  context.holdings.slice(0, 10).forEach((h, i) => {
    lines.push(
      `${i + 1}. ${h.symbol}: ${h.shares} shares @ ${h.currentPrice.toFixed(2)} (cost ${h.costBasis.toFixed(2)}) | ${formatPercent(h.pnlPercent)} | ${h.weight.toFixed(1)}% weight | ${h.sector}`
    );
  });
  lines.push('');

  lines.push('Health Breakdown:');
  lines.push(`- Concentration: ${context.health.concentration}`);
  lines.push(`- Diversification: ${context.health.diversification}`);
  lines.push(`- Volatility: ${context.health.volatility}`);
  lines.push(`- Drawdown: ${context.health.drawdown}`);
  lines.push('');

  if (context.health.alerts.length > 0) {
    lines.push('Alerts:');
    context.health.alerts.forEach((a) => lines.push(`- ${a}`));
  } else {
    lines.push('Alerts: No critical alerts');
  }

  if (context.trend.direction !== 'stable') {
    lines.push('');
    lines.push(`Trend: Health score is ${context.trend.direction}`);
  }

  return lines.join('\n');
}
