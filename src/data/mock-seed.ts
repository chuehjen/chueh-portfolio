import { Holding, PriceSnapshot, DailyPortfolioSnapshot } from '../domain/types';

export const MOCK_HOLDINGS: Holding[] = [
  { id: 'h1', symbol: 'NVDA', name: 'NVIDIA Corp', shares: 50, costBasisPerShare: 118.5, currency: 'USD', sector: 'Technology', importedAt: '2025-03-15' },
  { id: 'h2', symbol: 'AAPL', name: 'Apple Inc', shares: 80, costBasisPerShare: 172.3, currency: 'USD', sector: 'Technology', importedAt: '2024-11-20' },
  { id: 'h3', symbol: 'GOOGL', name: 'Alphabet Inc', shares: 30, costBasisPerShare: 155.0, currency: 'USD', sector: 'Communication Services', importedAt: '2025-01-08' },
  { id: 'h4', symbol: 'AMZN', name: 'Amazon.com Inc', shares: 40, costBasisPerShare: 178.0, currency: 'USD', sector: 'Consumer Discretionary', importedAt: '2025-02-10' },
  { id: 'h5', symbol: 'JPM', name: 'JPMorgan Chase', shares: 25, costBasisPerShare: 195.0, currency: 'USD', sector: 'Financials', importedAt: '2025-04-01' },
  { id: 'h6', symbol: '00700.HK', name: '腾讯控股', shares: 200, costBasisPerShare: 345.0, currency: 'HKD', sector: 'Communication Services', importedAt: '2025-01-12' },
  { id: 'h7', symbol: 'TSLA', name: 'Tesla Inc', shares: 20, costBasisPerShare: 242.0, currency: 'USD', sector: 'Consumer Discretionary', importedAt: '2025-05-01' },
  { id: 'h8', symbol: 'LLY', name: 'Eli Lilly & Co', shares: 10, costBasisPerShare: 780.0, currency: 'USD', sector: 'Healthcare', importedAt: '2025-02-28' },
];

const today = new Date().toISOString().split('T')[0];

export const MOCK_PRICES: PriceSnapshot[] = [
  { id: `NVDA-${today}`, symbol: 'NVDA', price: 135.2, previousClose: 132.8, change: 2.4, changePercent: 1.81, high52w: 153.0, low52w: 75.6, capturedAt: today },
  { id: `AAPL-${today}`, symbol: 'AAPL', price: 198.5, previousClose: 196.2, change: 2.3, changePercent: 1.17, high52w: 210.0, low52w: 164.1, capturedAt: today },
  { id: `GOOGL-${today}`, symbol: 'GOOGL', price: 178.3, previousClose: 176.9, change: 1.4, changePercent: 0.79, high52w: 192.0, low52w: 130.7, capturedAt: today },
  { id: `AMZN-${today}`, symbol: 'AMZN', price: 195.8, previousClose: 193.5, change: 2.3, changePercent: 1.19, high52w: 215.0, low52w: 151.6, capturedAt: today },
  { id: `JPM-${today}`, symbol: 'JPM', price: 218.5, previousClose: 216.0, change: 2.5, changePercent: 1.16, high52w: 230.0, low52w: 171.3, capturedAt: today },
  { id: `00700.HK-${today}`, symbol: '00700.HK', price: 420.0, previousClose: 415.0, change: 5.0, changePercent: 1.20, high52w: 460.0, low52w: 290.0, capturedAt: today },
  { id: `TSLA-${today}`, symbol: 'TSLA', price: 258.0, previousClose: 261.5, change: -3.5, changePercent: -1.34, high52w: 310.0, low52w: 138.8, capturedAt: today },
  { id: `LLY-${today}`, symbol: 'LLY', price: 820.0, previousClose: 815.0, change: 5.0, changePercent: 0.61, high52w: 890.0, low52w: 580.0, capturedAt: today },
];

function generateDailySnapshots(): DailyPortfolioSnapshot[] {
  const snapshots: DailyPortfolioSnapshot[] = [];
  const baseValue = 52000;
  const baseCost = 48500;

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const fluctuation = (Math.sin(i * 0.3) * 1500) + (i < 15 ? -800 : 600);
    const totalValue = baseValue + fluctuation + (30 - i) * 80;
    const totalPnL = totalValue - baseCost;
    const totalPnLPercent = (totalPnL / baseCost) * 100;
    const healthScore = Math.min(100, Math.max(40, 68 + Math.sin(i * 0.2) * 8 + (30 - i) * 0.3));

    snapshots.push({
      date: dateStr,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCost: baseCost,
      totalPnL: Math.round(totalPnL * 100) / 100,
      totalPnLPercent: Math.round(totalPnLPercent * 100) / 100,
      healthScore: Math.round(healthScore * 10) / 10,
      holdingCount: 8,
    });
  }
  return snapshots;
}

export const MOCK_DAILY_SNAPSHOTS = generateDailySnapshots();
