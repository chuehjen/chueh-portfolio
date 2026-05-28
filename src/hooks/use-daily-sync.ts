import { useState, useRef, useCallback } from 'react';
import { getHoldings, savePriceSnapshots } from '../data/storage';
import { yahooProvider } from '../data/market-api';
import { calculatePortfolioSummary } from '../domain/portfolio-calculator';
import { saveDailySnapshot } from '../data/storage';
import { calculateHealthScore } from '../domain/health-score';
import { getDailySnapshots } from '../data/storage';
import { getLatestPrices } from '../data/storage';

export function useDailySync() {
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const syncingRef = useRef(false);

  const triggerSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncInProgress(true);

    try {
      const holdings = await getHoldings();
      if (holdings.length === 0) {
        setLastSync(null);
        return;
      }

      const symbols = holdings.map((h) => h.symbol);
      const priceData = await yahooProvider.getPrices(symbols);

      const today = new Date().toISOString().split('T')[0];
      const snapshots = Array.from(priceData.entries()).map(([symbol, data]) => ({
        id: `${symbol}-${today}`,
        symbol,
        price: data.price,
        previousClose: data.previousClose,
        change: data.change,
        changePercent: data.changePercent,
        high52w: data.high52w,
        low52w: data.low52w,
        capturedAt: today,
      }));

      await savePriceSnapshots(snapshots);

      // Save daily portfolio snapshot
      const prices = new Map(snapshots.map((s) => [s.symbol, s]));
      const pricesForStorage = await getLatestPrices(symbols);
      const summary = calculatePortfolioSummary(holdings, pricesForStorage);
      const snapshotsForTrend = await getDailySnapshots(30);
      const health = calculateHealthScore(holdings, pricesForStorage, snapshotsForTrend);

      await saveDailySnapshot({
        date: today,
        totalValue: summary.totalValue,
        totalCost: summary.totalCost,
        totalPnL: summary.totalPnL,
        totalPnLPercent: summary.totalPnLPercent,
        healthScore: health.overall,
        holdingCount: holdings.length,
      });

      setLastSync(new Date().toISOString());
    } finally {
      syncingRef.current = false;
      setSyncInProgress(false);
    }
  }, []);

  return { lastSync, syncInProgress, triggerSync };
}
