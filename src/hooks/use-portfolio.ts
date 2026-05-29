import { useState, useEffect, useCallback } from 'react';
import { Holding, PriceSnapshot } from '../domain/types';
import { getHoldings } from '../data/storage';
import { getLatestPrices } from '../data/storage';
import { yahooProvider, normalizeSymbol } from '../data/market-api';
import {
  calculatePortfolioSummary,
  calculateHoldingDetails,
  PortfolioSummary,
  HoldingWithDetails,
} from '../domain/portfolio-calculator';

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [prices, setPrices] = useState<Map<string, PriceSnapshot>>(new Map());
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [details, setDetails] = useState<HoldingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const h = await getHoldings();
      setHoldings(h);

      if (h.length > 0) {
        const symbols = h.map((h) => h.symbol);
        const p = await getLatestPrices(symbols);
        setPrices(p);

        const sum = calculatePortfolioSummary(h, p);
        setSummary(sum);
        setDetails(calculateHoldingDetails(h, p, sum.totalValue));
      } else {
        setPrices(new Map());
        setSummary(null);
        setDetails([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    if (holdings.length === 0) return;
    try {
      const symbols = [...new Set(holdings.map((h) => normalizeSymbol(h.symbol)))];
      const priceData = await yahooProvider.getPrices(symbols);

      if (priceData.size === 0) return; // 网络失败/超时，保留现有价格

      const snapshots = Array.from(priceData.entries()).map(([symbol, data]) => ({
        id: `${symbol}-${new Date().toISOString().split('T')[0]}`,
        symbol,
        price: data.price,
        previousClose: data.previousClose,
        change: data.change,
        changePercent: data.changePercent,
        high52w: data.high52w,
        low52w: data.low52w,
        capturedAt: new Date().toISOString().split('T')[0],
      }));

      const { savePriceSnapshots } = await import('../data/storage');
      await savePriceSnapshots(snapshots);

      // 直接更新 prices state，避免 loadData 触发整页 loading
      const p = await getLatestPrices(holdings.map((h) => h.symbol));
      setPrices(p);
      const sum = calculatePortfolioSummary(holdings, p);
      setSummary(sum);
      setDetails(calculateHoldingDetails(holdings, p, sum.totalValue));
    } catch (e) {
      // 静默失败：网络异常/超时不阻塞 UI
      console.warn('[refresh] failed:', e);
    }
  }, [holdings]);

  return {
    holdings,
    prices,
    summary,
    details,
    isLoading,
    refresh,
    loadData,
  };
}
