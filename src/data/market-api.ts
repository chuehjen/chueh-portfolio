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

// ─── Twelve Data（美股主源）─────────────────────────────────
const TWELVE_DATA_KEY = process.env.EXPO_PUBLIC_TWELVEDATA_API_KEY ?? '';

async function fetchTwelveDataPrices(symbols: string[]): Promise<Map<string, PriceData>> {
  if (!TWELVE_DATA_KEY || symbols.length === 0) return new Map();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const symbolsParam = symbols.join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${symbolsParam}&apikey=${TWELVE_DATA_KEY}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return new Map();

    const json = await res.json();
    const priceMap = new Map<string, PriceData>();

    // 单 symbol 返回对象，多 symbol 返回 { AAPL: {...}, NVDA: {...} }
    const entries: [string, any][] = symbols.length === 1
      ? [[symbols[0], json]]
      : Object.entries(json);

    for (const [sym, data] of entries) {
      if (!data || data.code || data.status === 'error') continue;
      const price = parseFloat(data.close);
      const previousClose = parseFloat(data.previous_close);
      if (isNaN(price) || isNaN(previousClose)) continue;

      priceMap.set(sym, {
        price,
        previousClose,
        change: parseFloat(data.change) || price - previousClose,
        changePercent: parseFloat(data.percent_change) || 0,
        high52w: parseFloat(data.fifty_two_week?.high) || 0,
        low52w: parseFloat(data.fifty_two_week?.low) || 0,
        currency: data.currency || 'USD',
      });
    }
    return priceMap;
  } catch {
    return new Map();
  } finally {
    clearTimeout(timer);
  }
}

// ─── 腾讯行情（港股 + 美股兜底）─────────────────────────────
function toTencentSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  // 港股: 00700.HK → hk00700 / 00700 → hk00700
  if (/^\d{4,5}(\.HK)?$/i.test(upper)) {
    const code = upper.replace('.HK', '');
    return `hk${code}`;
  }
  // 美股: AAPL → usAAPL
  return `us${upper.replace('.OQ', '').replace('.N', '')}`;
}

function fromTencentSymbol(tencentSym: string): string {
  if (tencentSym.startsWith('hk')) {
    const code = tencentSym.slice(2);
    return `${code}.HK`;
  }
  return tencentSym.slice(2).toUpperCase();
}

async function fetchTencentPrices(symbols: string[]): Promise<Map<string, PriceData>> {
  if (symbols.length === 0) return new Map();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const tencentSymbols = symbols.map(toTencentSymbol);
    const url = `https://qt.gtimg.cn/q=${tencentSymbols.join(',')}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return new Map();

    const text = await res.text();
    const priceMap = new Map<string, PriceData>();

    // 响应格式: v_usAAPL="...~...~..."; v_hk00700="...~...~..."
    const lines = text.split(';').filter((l) => l.includes('~'));

    for (const line of lines) {
      const keyMatch = line.match(/v_(\w+)=/);
      if (!keyMatch) continue;

      const tencentKey = keyMatch[1];
      const fields = line.split('~');
      if (fields.length < 50) continue;

      const price = parseFloat(fields[3]);
      const previousClose = parseFloat(fields[4]);
      if (isNaN(price) || isNaN(previousClose) || price === 0) continue;

      const change = parseFloat(fields[31]) || price - previousClose;
      const changePercent = parseFloat(fields[32]) || 0;
      const high52w = parseFloat(fields[48]) || 0;
      const low52w = parseFloat(fields[49]) || 0;

      // 港股货币在 field[75]，美股在 field[35]
      const isHK = tencentKey.startsWith('hk');
      const currency = isHK ? (fields[75] || 'HKD') : (fields[35] || 'USD');

      const originalSymbol = fromTencentSymbol(tencentKey);
      priceMap.set(originalSymbol, {
        price, previousClose, change, changePercent, high52w, low52w, currency,
      });
    }
    return priceMap;
  } catch {
    return new Map();
  } finally {
    clearTimeout(timer);
  }
}

// ─── 混合策略：Twelve Data 美股 + 腾讯港股 + 腾讯兜底 ────────
async function fetchHybridPrices(symbols: string[]): Promise<Map<string, PriceData>> {
  const usSymbols = symbols.filter((s) => !isHKSymbol(s));
  const hkSymbols = symbols.filter((s) => isHKSymbol(s));

  // 并发：Twelve Data 拉美股（有52w数据），腾讯拉全部（兜底）
  const [twelvePrices, tencentPrices] = await Promise.all([
    TWELVE_DATA_KEY && usSymbols.length > 0
      ? fetchTwelveDataPrices(usSymbols)
      : Promise.resolve(new Map<string, PriceData>()),
    fetchTencentPrices(symbols),
  ]);

  // 合并：Twelve Data 优先（数据更精确），腾讯兜底
  const merged = new Map<string, PriceData>();

  for (const sym of symbols) {
    const normalSym = normalizeSymbol(sym);
    const td = twelvePrices.get(sym) || twelvePrices.get(normalSym);
    const tc = tencentPrices.get(sym) || tencentPrices.get(normalSym);
    if (td) {
      merged.set(normalSym, td);
    } else if (tc) {
      merged.set(normalSym, tc);
    }
  }
  return merged;
}

function isHKSymbol(symbol: string): boolean {
  return /^\d{4,5}(\.HK)?$/i.test(symbol.toUpperCase());
}

// 导出时保留 `yahooProvider` 命名以兼容现有引用
export const yahooProvider: MarketDataProvider = {
  name: 'hybrid-twelvedata-tencent',
  getPrices: fetchHybridPrices,
};

export function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (/^\d{5}\.HK$/i.test(upper)) return upper;
  if (/^\d{4,5}$/.test(upper)) return `${upper.padStart(5, '0')}.HK`;
  return upper;
}
