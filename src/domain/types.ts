export interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  costBasisPerShare: number;
  currency: string;
  sector: string;
  importedAt: string;
}

export interface PriceSnapshot {
  id: string;
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  capturedAt: string;
}

export interface DailyPortfolioSnapshot {
  date: string;
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  healthScore: number;
  holdingCount: number;
}

export interface HealthScoreComponents {
  concentration: number;
  diversification: number;
  volatility: number;
  drawdown: number;
  overall: number;
}

export interface HealthScoreResult {
  overall: number;
  components: HealthScoreComponents;
  alerts: string[];
  trends: {
    score7d: number | null;
    score30d: number | null;
    direction: 'improving' | 'declining' | 'stable';
  };
}

export interface ImportResult {
  holdings: Holding[];
  errors: string[];
  source: 'futu' | 'firstrade' | 'manual';
}
