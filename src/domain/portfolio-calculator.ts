import { Holding, PriceSnapshot } from '../domain/types';

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  todayChange: number;
  todayChangePercent: number;
}

export interface HoldingWithDetails {
  holding: Holding;
  currentPrice: number;
  value: number;
  cost: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
  dayChange: number;
  dayChangePercent: number;
}

export function calculatePortfolioSummary(
  holdings: Holding[],
  prices: Map<string, PriceSnapshot>
): PortfolioSummary {
  let totalValue = 0;
  let totalCost = 0;
  let todayValue = 0;
  let todayCost = 0;

  for (const h of holdings) {
    const priceData = prices.get(h.symbol);
    const price = priceData?.price || h.costBasisPerShare;
    const prevClose = priceData?.previousClose || price;

    totalValue += h.shares * price;
    totalCost += h.shares * h.costBasisPerShare;
    todayValue += h.shares * price;
    todayCost += h.shares * prevClose;
  }

  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const todayChange = todayValue - todayCost;
  const todayChangePercent = todayCost > 0 ? (todayChange / todayCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalPnL,
    totalPnLPercent,
    todayChange,
    todayChangePercent,
  };
}

export function calculateHoldingDetails(
  holdings: Holding[],
  prices: Map<string, PriceSnapshot>,
  totalValue: number
): HoldingWithDetails[] {
  return holdings
    .map((h) => {
      const priceData = prices.get(h.symbol);
      const currentPrice = priceData?.price || h.costBasisPerShare;
      const prevClose = priceData?.previousClose || currentPrice;
      const value = h.shares * currentPrice;
      const cost = h.shares * h.costBasisPerShare;
      const pnl = value - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
      const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
      const dayChange = currentPrice - prevClose;
      const dayChangePercent = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;

      return {
        holding: h,
        currentPrice,
        value,
        cost,
        pnl,
        pnlPercent,
        weight,
        dayChange,
        dayChangePercent,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export async function refreshAllPrices(
  holdings: Holding[],
  provider: { getPrices(symbols: string[]): Promise<Map<string, { price: number; previousClose: number; change: number; changePercent: number; high52w: number; low52w: number; currency: string }>> }
): Promise<{ updated: number; failed: string[] }> {
  const symbols = [...new Set(holdings.map((h) => h.symbol))];
  if (symbols.length === 0) return { updated: 0, failed: [] };

  try {
    const priceDataMap = await provider.getPrices(symbols);
    const snapshots = [];

    const today = new Date().toISOString().split('T')[0];

    for (const [symbol, data] of priceDataMap) {
      snapshots.push({
        id: `${symbol}-${today}`,
        symbol,
        price: data.price,
        previousClose: data.previousClose,
        change: data.change,
        changePercent: data.changePercent,
        high52w: data.high52w,
        low52w: data.low52w,
        capturedAt: today,
      });
    }

    const { savePriceSnapshots } = await import('../data/storage');
    await savePriceSnapshots(snapshots);

    const failed = symbols.filter((s) => !priceDataMap.has(s));
    return { updated: priceDataMap.size, failed };
  } catch {
    return { updated: 0, failed: symbols };
  }
}
