export const HEALTH_WEIGHTS = {
  concentration: 0.30,
  diversification: 0.25,
  volatility: 0.20,
  drawdown: 0.25,
} as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  HKD: 'HK$',
  GBP: '£',
  CAD: 'C$',
  EUR: '€',
  CNY: '¥',
} as const;

export const SECTOR_BETA: Record<string, number> = {
  Technology: 1.2,
  Healthcare: 0.8,
  Financials: 1.1,
  'Consumer Discretionary': 1.15,
  'Consumer Staples': 0.6,
  Energy: 1.3,
  Utilities: 0.5,
  'Real Estate': 0.7,
  Materials: 1.0,
  Industrials: 1.05,
  'Communication Services': 1.1,
  Unknown: 1.0,
} as const;
