import { Holding, ImportResult } from '../domain/types';
import { getSector } from './sector-map';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function detectFormat(csvContent: string): 'futu' | 'firstrade' | 'unknown' {
  const firstLine = csvContent.split('\n')[0].toLowerCase();
  if (firstLine.includes('stock code') || firstLine.includes('股票代码')) {
    return 'futu';
  }
  if (firstLine.includes('symbol') && (firstLine.includes('cost basis') || firstLine.includes('quantity'))) {
    return 'firstrade';
  }
  return 'unknown';
}

export function parseFutuCSV(csvContent: string): ImportResult {
  const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { holdings: [], errors: ['CSV 内容为空或格式不正确'], source: 'futu' };
  }

  const headers = parseCSVLine(lines[0]);
  const holdings: Holding[] = [];
  const errors: string[] = [];

  const stockCodeIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('stock code') || h.toLowerCase().includes('股票代码')
  );
  const stockNameIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('stock name') || h.toLowerCase().includes('股票名称')
  );
  const quantityIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('quantity') || h.toLowerCase().includes('数量')
  );
  const costPriceIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('cost price') || h.toLowerCase().includes('成本价')
  );

  if (stockCodeIdx === -1 || quantityIdx === -1) {
    return {
      holdings: [],
      errors: ['无法识别 Futu CSV 格式，请确认包含股票代码和数量列'],
      source: 'futu',
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const symbol = cols[stockCodeIdx]?.replace(/"/g, '') || '';
    const name = cols[stockNameIdx]?.replace(/"/g, '') || symbol;
    const shares = parseFloat(cols[quantityIdx] || '0');
    const costBasis = parseFloat(cols[costPriceIdx] || '0');

    if (!symbol || isNaN(shares) || shares <= 0) {
      errors.push(`第 ${i + 1} 行数据不完整，已跳过`);
      continue;
    }

    const normalizedSymbol = normalizeFutuSymbol(symbol);
    const currency = inferCurrency(normalizedSymbol);

    holdings.push({
      id: generateId(),
      symbol: normalizedSymbol,
      name,
      shares,
      costBasisPerShare: isNaN(costBasis) ? 0 : costBasis,
      currency,
      sector: getSector(normalizedSymbol),
      importedAt: new Date().toISOString(),
    });
  }

  return { holdings, errors, source: 'futu' };
}

export function parseFirstTradeCSV(csvContent: string): ImportResult {
  const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { holdings: [], errors: ['CSV 内容为空或格式不正确'], source: 'firstrade' };
  }

  const headers = parseCSVLine(lines[0]);
  const holdings: Holding[] = [];
  const errors: string[] = [];

  const symbolIdx = headers.findIndex((h) => h.toLowerCase().includes('symbol'));
  const descIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('description') || h.toLowerCase().includes('name')
  );
  const quantityIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('quantity') || h.toLowerCase().includes('shares')
  );
  const costBasisIdx = headers.findIndex(
    (h) => h.toLowerCase().includes('cost basis') || h.toLowerCase().includes('avg price')
  );

  if (symbolIdx === -1 || quantityIdx === -1) {
    return {
      holdings: [],
      errors: ['无法识别 FirstTrade CSV 格式，请确认包含 Symbol 和 Quantity 列'],
      source: 'firstrade',
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const symbol = cols[symbolIdx]?.replace(/"/g, '') || '';
    const name = cols[descIdx]?.replace(/"/g, '') || symbol;
    const shares = parseFloat(cols[quantityIdx] || '0');
    const costBasis = parseFloat(cols[costBasisIdx] || '0');

    if (!symbol || isNaN(shares) || shares <= 0) {
      errors.push(`第 ${i + 1} 行数据不完整，已跳过`);
      continue;
    }

    holdings.push({
      id: generateId(),
      symbol: symbol.toUpperCase(),
      name,
      shares,
      costBasisPerShare: isNaN(costBasis) ? 0 : costBasis,
      currency: 'USD',
      sector: getSector(symbol.toUpperCase()),
      importedAt: new Date().toISOString(),
    });
  }

  return { holdings, errors, source: 'firstrade' };
}

export function parseCSV(
  csvContent: string,
  format?: 'futu' | 'firstrade'
): ImportResult {
  const detected = format || detectFormat(csvContent);
  if (detected === 'futu') return parseFutuCSV(csvContent);
  if (detected === 'firstrade') return parseFirstTradeCSV(csvContent);
  return {
    holdings: [],
    errors: ['无法自动识别 CSV 格式，请选择 Futu 或 FirstTrade'],
    source: 'futu',
  };
}

function normalizeFutuSymbol(symbol: string): string {
  const clean = symbol.replace(/"/g, '').trim();
  if (/^\d{5}$/.test(clean)) {
    return `${clean}.HK`;
  }
  if (/^\d{6}$/.test(clean)) {
    return `${clean}.SH`;
  }
  return clean.toUpperCase();
}

function inferCurrency(symbol: string): string {
  if (symbol.endsWith('.HK')) return 'HKD';
  if (symbol.endsWith('.SH') || symbol.endsWith('.SZ')) return 'CNY';
  return 'USD';
}
