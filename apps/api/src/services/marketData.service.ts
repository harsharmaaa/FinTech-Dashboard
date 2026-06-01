import { prisma } from "../lib/prisma";

export interface OHLCVRow {
  time: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number | null;
}

/**
 * Stores OHLCV candles into daily or 1min TimescaleDB hypertables.
 * Performs a high-performance batch insert with conflict updates.
 */
export async function storeOHLCV(
  symbol: string,
  data: OHLCVRow[],
  timeframe: string
): Promise<void> {
  if (data.length === 0) return;

  const upperSymbol = symbol.toUpperCase().trim();
  const tableName = timeframe === "1Min" ? "ohlcv_1min" : "ohlcv_daily";

  // Parameter limits in pg are 65535. Each row uses 8 variables.
  // We chunk into 1000 rows (8000 parameters) per query for safety.
  const chunkSize = 1000;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);

    const valueRows: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const row of chunk) {
      valueRows.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`);
      values.push(
        upperSymbol,
        row.open,
        row.high,
        row.low,
        row.close,
        row.volume,
        row.vwap || null,
        new Date(row.time)
      );
      paramIndex += 8;
    }

    const query = `
      INSERT INTO ${tableName} (symbol, open, high, low, close, volume, vwap, timestamp)
      VALUES ${valueRows.join(", ")}
      ON CONFLICT (symbol, timestamp) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        vwap = EXCLUDED.vwap;
    `;

    await prisma.$executeRawUnsafe(query, ...values);
  }
}

/**
 * Retrieves OHLCV data from the correct hypertable for a given range.
 */
export async function getOHLCV(
  symbol: string,
  timeframe: string,
  from: Date,
  to: Date
): Promise<OHLCVRow[]> {
  const upperSymbol = symbol.toUpperCase().trim();
  const tableName = timeframe === "1Min" ? "ohlcv_1min" : "ohlcv_daily";

  const query = `
    SELECT timestamp as time, open, high, low, close, volume, vwap
    FROM ${tableName}
    WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3
    ORDER BY timestamp ASC;
  `;

  const rows = await prisma.$queryRawUnsafe<any[]>(query, upperSymbol, from, to);
  return rows.map((r) => ({
    time: r.time,
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
    vwap: r.vwap ? Number(r.vwap) : null,
  }));
}

/**
 * Gets the latest closing price of a stock from the database.
 */
export async function getLatestPrice(symbol: string): Promise<number | null> {
  const upperSymbol = symbol.toUpperCase().trim();
  const query = `
    SELECT close
    FROM ohlcv_daily
    WHERE symbol = $1
    ORDER BY timestamp DESC
    LIMIT 1;
  `;
  const rows = await prisma.$queryRawUnsafe<any[]>(query, upperSymbol);
  return rows.length > 0 ? Number(rows[0].close) : null;
}

/**
 * Retrieves the last 'limit' OHLCV rows from the database, sorted chronologically.
 */
export async function getOHLCVWithLimit(
  symbol: string,
  timeframe: string,
  limit: number
): Promise<OHLCVRow[]> {
  const upperSymbol = symbol.toUpperCase().trim();
  const tableName = timeframe === "1Min" ? "ohlcv_1min" : "ohlcv_daily";

  const query = `
    SELECT timestamp as time, open, high, low, close, volume, vwap
    FROM ${tableName}
    WHERE symbol = $1
    ORDER BY timestamp DESC
    LIMIT $2;
  `;

  const rows = await prisma.$queryRawUnsafe<any[]>(query, upperSymbol, limit);
  const mapped = rows.map((r) => ({
    time: r.time,
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
    vwap: r.vwap ? Number(r.vwap) : null,
  }));

  // Return chronologically sorted (ASC)
  return mapped.reverse();
}
