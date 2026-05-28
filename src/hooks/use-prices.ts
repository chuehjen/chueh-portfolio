import { useState, useEffect } from 'react';
import { PriceSnapshot } from '../domain/types';
import { getLatestPrices } from '../data/storage';

export function usePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Map<string, PriceSnapshot>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (symbols.length === 0) {
      setPrices(new Map());
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const result = await getLatestPrices(symbols);
      if (!cancelled) {
        setPrices(result);
        setLastUpdated(new Date().toISOString());
        setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [symbols]);

  return { prices, isLoading, lastUpdated };
}
