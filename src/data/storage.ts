import * as SQLite from 'expo-sqlite';
import {
  Holding,
  PriceSnapshot,
  DailyPortfolioSnapshot,
} from '../domain/types';
import { MOCK_HOLDINGS, MOCK_PRICES, MOCK_DAILY_SNAPSHOTS } from './mock-seed';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('portfolio.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS holdings (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      shares REAL NOT NULL,
      cost_basis REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      sector TEXT NOT NULL DEFAULT 'Unknown',
      imported_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_snapshots (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      price REAL NOT NULL,
      previous_close REAL NOT NULL,
      change REAL NOT NULL,
      change_percent REAL NOT NULL,
      high_52w REAL NOT NULL DEFAULT 0,
      low_52w REAL NOT NULL DEFAULT 0,
      captured_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_portfolio_snapshots (
      date TEXT PRIMARY KEY,
      total_value REAL NOT NULL,
      total_cost REAL NOT NULL,
      total_pnl REAL NOT NULL,
      total_pnl_percent REAL NOT NULL,
      health_score REAL NOT NULL,
      holding_count INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_price_symbol_date
      ON price_snapshots(symbol, captured_at);
  `);

  // Seed mock data if database is empty
  const count = await db.getFirstAsync('SELECT COUNT(*) as cnt FROM holdings') as { cnt: number } | null;
  if (!count || count.cnt === 0) {
    for (const h of MOCK_HOLDINGS) {
      await db.runAsync(
        `INSERT OR REPLACE INTO holdings (id, symbol, name, shares, cost_basis, currency, sector, imported_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [h.id, h.symbol, h.name, h.shares, h.costBasisPerShare, h.currency, h.sector, h.importedAt]
      );
    }
    for (const p of MOCK_PRICES) {
      await db.runAsync(
        `INSERT OR REPLACE INTO price_snapshots (id, symbol, price, previous_close, change, change_percent, high_52w, low_52w, captured_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.symbol, p.price, p.previousClose, p.change, p.changePercent, p.high52w, p.low52w, p.capturedAt]
      );
    }
    for (const s of MOCK_DAILY_SNAPSHOTS) {
      await db.runAsync(
        `INSERT OR REPLACE INTO daily_portfolio_snapshots (date, total_value, total_cost, total_pnl, total_pnl_percent, health_score, holding_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [s.date, s.totalValue, s.totalCost, s.totalPnL, s.totalPnLPercent, s.healthScore, s.holdingCount]
      );
    }
  }
}

async function ensureDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

// Holdings CRUD

export async function getHoldings(): Promise<Holding[]> {
  const rows = await (await ensureDb()).getAllAsync(
    'SELECT id, symbol, name, shares, cost_basis, currency, sector, imported_at FROM holdings'
  ) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id as string,
    symbol: row.symbol as string,
    name: row.name as string,
    shares: row.shares as number,
    costBasisPerShare: row.cost_basis as number,
    currency: row.currency as string,
    sector: row.sector as string,
    importedAt: row.imported_at as string,
  }));
}

export async function upsertHolding(holding: Holding): Promise<void> {
  await (await ensureDb()).runAsync(
    `INSERT OR REPLACE INTO holdings (id, symbol, name, shares, cost_basis, currency, sector, imported_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [holding.id, holding.symbol, holding.name, holding.shares, holding.costBasisPerShare, holding.currency, holding.sector, holding.importedAt]
  );
}

export async function deleteHolding(id: string): Promise<void> {
  await (await ensureDb()).runAsync('DELETE FROM holdings WHERE id = ?', [id]);
}

export async function clearAllHoldings(): Promise<void> {
  const db = await ensureDb();
  await db.runAsync('DELETE FROM holdings');
  await db.runAsync('DELETE FROM price_snapshots');
  await db.runAsync('DELETE FROM daily_portfolio_snapshots');
}

// Price snapshots

export async function getLatestPrice(symbol: string): Promise<PriceSnapshot | null> {
  const row = await (await ensureDb()).getFirstAsync(
    `SELECT id, symbol, price, previous_close, change, change_percent, high_52w, low_52w, captured_at
     FROM price_snapshots
     WHERE symbol = ?
     ORDER BY captured_at DESC
     LIMIT 1`,
    [symbol]
  ) as Record<string, unknown> | null;
  if (!row) return null;
  return mapPriceRow(row);
}

export async function getLatestPrices(symbols: string[]): Promise<Map<string, PriceSnapshot>> {
  if (symbols.length === 0) return new Map();
  const placeholders = symbols.map(() => '?').join(',');
  const db = await ensureDb();
  const rows = await db.getAllAsync(
    `SELECT p.* FROM price_snapshots p
     INNER JOIN (
       SELECT symbol, MAX(captured_at) as max_date
       FROM price_snapshots
       WHERE symbol IN (${placeholders})
       GROUP BY symbol
     ) latest ON p.symbol = latest.symbol AND p.captured_at = latest.max_date`,
    symbols
  ) as Record<string, unknown>[];
  const result = new Map<string, PriceSnapshot>();
  for (const row of rows) {
    result.set(row.symbol as string, mapPriceRow(row));
  }
  return result;
}

export async function savePriceSnapshots(snapshots: PriceSnapshot[]): Promise<void> {
  const db = await ensureDb();
  for (const s of snapshots) {
    await db.runAsync(
      `INSERT OR REPLACE INTO price_snapshots (id, symbol, price, previous_close, change, change_percent, high_52w, low_52w, captured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.symbol, s.price, s.previousClose, s.change, s.changePercent, s.high52w, s.low52w, s.capturedAt]
    );
  }
}

// Daily portfolio snapshots

export async function getDailySnapshots(limit: number = 30): Promise<DailyPortfolioSnapshot[]> {
  const rows = await (await ensureDb()).getAllAsync(
    `SELECT date, total_value, total_cost, total_pnl, total_pnl_percent, health_score, holding_count
     FROM daily_portfolio_snapshots
     ORDER BY date DESC
     LIMIT ?`,
    [limit]
  ) as Record<string, unknown>[];
  return rows.map((row) => ({
    date: row.date as string,
    totalValue: row.total_value as number,
    totalCost: row.total_cost as number,
    totalPnL: row.total_pnl as number,
    totalPnLPercent: row.total_pnl_percent as number,
    healthScore: row.health_score as number,
    holdingCount: row.holding_count as number,
  }));
}

export async function saveDailySnapshot(snapshot: DailyPortfolioSnapshot): Promise<void> {
  await (await ensureDb()).runAsync(
    `INSERT OR REPLACE INTO daily_portfolio_snapshots
     (date, total_value, total_cost, total_pnl, total_pnl_percent, health_score, holding_count)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [snapshot.date, snapshot.totalValue, snapshot.totalCost, snapshot.totalPnL, snapshot.totalPnLPercent, snapshot.healthScore, snapshot.holdingCount]
  );
}

function mapPriceRow(row: Record<string, unknown>): PriceSnapshot {
  return {
    id: row.id as string,
    symbol: row.symbol as string,
    price: row.price as number,
    previousClose: row.previous_close as number,
    change: row.change as number,
    changePercent: row.change_percent as number,
    high52w: (row.high_52w as number) || 0,
    low52w: (row.low_52w as number) || 0,
    capturedAt: row.captured_at as string,
  };
}
