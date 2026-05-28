export interface PriceData {
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  currency: string;
}

export interface HistoricalPrice {
  date: string;
  close: number;
  volume: number;
}

export interface MarketDataProvider {
  name: string;
  getPrices(symbols: string[]): Promise<Map<string, PriceData>>;
}

async function fetchYahooPrices(symbols: string[]): Promise<Map<string, PriceData>> {
  const symbolsParam = symbols.join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PortfolioApp/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const results = json.quoteResult?.result || [];
  const priceMap = new Map<string, PriceData>();

  for (const item of results) {
    if (!item.regularMarketPrice || !item.symbol) continue;

    const symbol = item.symbol as string;
    const price = item.regularMarketPrice as number;
    const previousClose = item.regularMarketPreviousClose as number;
    const change = price - previousClose;
    const changePercent = ((change / previousClose) * 100) || 0;

    priceMap.set(symbol, {
      price,
      previousClose,
      change,
      changePercent,
      high52w: (item.fiftyTwoWeekHigh as number) || 0,
      low52w: (item.fiftyTwoWeekLow as number) || 0,
      currency: (item.currency as string) || 'USD',
    });
  }

  return priceMap;
}

export const yahooProvider: MarketDataProvider = {
  name: 'yahoo',
  getPrices: fetchYahooPrices,
};

export function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (/^\d{5}\.HK$/i.test(upper) || /^\d{5}$/.test(upper)) {
    return upper.includes('.') ? upper : `${upper}.HK`;
  }
  return upper;
}
