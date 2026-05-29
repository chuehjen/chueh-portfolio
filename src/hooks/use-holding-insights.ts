import { useEffect, useState } from 'react';
import { Holding, PriceSnapshot } from '../domain/types';
import { getInsightsForHoldings } from '../data/insight-service';
import { HoldingInsight } from '../data/storage';

export function useHoldingInsights(
  holdings: Holding[],
  prices: Map<string, PriceSnapshot>
) {
  const [insights, setInsights] = useState<Map<string, HoldingInsight>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (holdings.length === 0) {
      setInsights(new Map());
      return;
    }
    setLoading(true);
    getInsightsForHoldings(holdings, prices)
      .then((m) => {
        if (alive) setInsights(m);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // 仅 holdings 变化时重新获取（symbols 变化）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings.map((h) => h.symbol).join(',')]);

  return { insights, loading };
}
