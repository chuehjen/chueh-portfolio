import { useState, useEffect } from 'react';
import { HealthScoreResult } from '../domain/types';
import { calculateHealthScore } from '../domain/health-score';
import { Holding, PriceSnapshot, DailyPortfolioSnapshot } from '../domain/types';
import { getDailySnapshots } from '../data/storage';

export function useHealthScore(
  holdings: Holding[],
  prices: Map<string, PriceSnapshot>
) {
  const [score, setScore] = useState<HealthScoreResult>({
    overall: 0,
    components: { concentration: 0, diversification: 0, volatility: 0, drawdown: 0, overall: 0 },
    alerts: [],
    trends: { score7d: null, score30d: null, direction: 'stable' },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      setIsLoading(true);
      const snapshots = await getDailySnapshots(30);
      const result = calculateHealthScore(holdings, prices, snapshots);
      if (!cancelled) {
        setScore(result);
        setIsLoading(false);
      }
    }

    compute();
    return () => { cancelled = true; };
  }, [holdings, prices]);

  return { score, isLoading };
}
