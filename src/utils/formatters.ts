import { CURRENCY_SYMBOLS } from './constants';

export function formatCurrency(
  value: number,
  currency: string = 'USD',
  options: { noDecimals?: boolean } = {}
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const abs = Math.abs(value);
  const digits = options.noDecimals ? 0 : 2;
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function formatLastUpdate(isoDate: string | null): string {
  if (!isoDate) return '尚未同步';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚更新';
  if (diffMin < 60) return `${diffMin}分钟前更新`;
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
