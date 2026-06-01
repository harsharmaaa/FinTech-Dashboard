import Alpaca from "@alpacahq/alpaca-trade-api";
import { config } from "../config";
import { redis } from "../lib/redis";

export const alpaca = new Alpaca({
  keyId: config.alpaca.keyId,
  secretKey: config.alpaca.secretKey,
  paper: config.alpaca.paper,
});

function calculateStartDate(timeframe: string, limit: number): Date {
  const now = new Date();
  if (timeframe.endsWith("Min") || timeframe.endsWith("T")) {
    const mins = parseInt(timeframe) || 1;
    now.setMinutes(now.getMinutes() - limit * mins);
  } else if (timeframe.endsWith("Hour") || timeframe.endsWith("H")) {
    const hours = parseInt(timeframe) || 1;
    now.setHours(now.getHours() - limit * hours);
  } else if (timeframe.endsWith("Week") || timeframe.endsWith("W")) {
    const weeks = parseInt(timeframe) || 1;
    now.setDate(now.getDate() - limit * weeks * 7);
  } else if (timeframe.endsWith("Month") || timeframe.endsWith("M")) {
    const months = parseInt(timeframe) || 1;
    now.setMonth(now.getMonth() - limit * months);
  } else {
    // default to Day/D
    now.setDate(now.getDate() - limit);
  }
  return now;
}

export async function getQuote(symbol: string) {
  const upperSymbol = symbol.toUpperCase().trim();
  const cacheKey = `market:quote:${upperSymbol}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const snapshot = await alpaca.getSnapshot(upperSymbol);
  if (!snapshot) {
    throw new Error(`No snapshot data found for symbol ${upperSymbol}`);
  }

  const latestTrade = snapshot.LatestTrade;
  const latestQuote = snapshot.LatestQuote;
  const dailyBar = snapshot.DailyBar;
  const prevDailyBar = snapshot.PrevDailyBar;

  const lastPrice = latestTrade?.Price || dailyBar?.ClosePrice || 0;
  const prevClose = prevDailyBar?.ClosePrice || dailyBar?.OpenPrice || lastPrice;
  const changePercent = prevClose !== 0 ? ((lastPrice - prevClose) / prevClose) * 100 : 0;

  const normalized = {
    symbol: upperSymbol,
    bidPrice: latestQuote?.BidPrice || 0,
    bidSize: latestQuote?.BidSize || 0,
    askPrice: latestQuote?.AskPrice || 0,
    askSize: latestQuote?.AskSize || 0,
    lastPrice,
    volume: dailyBar?.Volume || 0,
    changePercent,
    timestamp: latestTrade?.Timestamp || latestQuote?.Timestamp || new Date().toISOString(),
  };

  // Cache for 3 seconds
  await redis.set(cacheKey, JSON.stringify(normalized), "EX", 3);
  return normalized;
}

export async function getBars(symbol: string, timeframe = "1Day", limit = 365) {
  const upperSymbol = symbol.toUpperCase().trim();
  const cacheKey = `market:bars:${upperSymbol}:${timeframe}:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const endDate = new Date();
  const startDate = calculateStartDate(timeframe, limit);

  const options = {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    timeframe,
    feed: "iex",
  };

  const barsGenerator = alpaca.getBarsV2(upperSymbol, options);
  const normalizedBars = [];

  for await (const bar of barsGenerator) {
    normalizedBars.push({
      time: bar.Timestamp,
      open: bar.OpenPrice,
      high: bar.HighPrice,
      low: bar.LowPrice,
      close: bar.ClosePrice,
      volume: bar.Volume,
    });

    if (normalizedBars.length >= limit) {
      break;
    }
  }

  // Cache for 1 minute (60 seconds)
  await redis.set(cacheKey, JSON.stringify(normalizedBars), "EX", 60);
  return normalizedBars;
}

export async function getTopMovers() {
  const cacheKey = "market:movers";
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Direct fetch to Alpaca Stock Movers Screener endpoint
  const response = await fetch("https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=10", {
    headers: {
      "APCA-API-KEY-ID": config.alpaca.keyId,
      "APCA-API-SECRET-KEY": config.alpaca.secretKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch movers from Alpaca: ${response.statusText}`);
  }

  const data = (await response.json()) as any;

  const normalizeMover = (mover: any) => ({
    symbol: mover.symbol,
    price: mover.price || 0,
    changePercent: mover.change || 0,
  });

  const normalized = {
    gainers: (data.gainers || []).map(normalizeMover),
    losers: (data.losers || []).map(normalizeMover),
  };

  // Cache for 1 minute (60 seconds)
  await redis.set(cacheKey, JSON.stringify(normalized), "EX", 60);
  return normalized;
}

export async function searchSymbols(query: string) {
  if (!query) return [];

  const cacheKey = "alpaca:assets:us_equity";
  let assetsRaw = await redis.get(cacheKey);
  let assets: any[];

  if (assetsRaw) {
    assets = JSON.parse(assetsRaw);
  } else {
    // Fetch all active us_equity assets from Alpaca
    assets = await alpaca.getAssets({
      status: "active",
      asset_class: "us_equity",
    });
    // Cache full assets list for 24 hours
    await redis.set(cacheKey, JSON.stringify(assets), "EX", 24 * 60 * 60);
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results = assets.filter((asset) => {
    const symbolMatch = asset.symbol?.toLowerCase().includes(normalizedQuery);
    const nameMatch = asset.name?.toLowerCase().includes(normalizedQuery);
    return asset.tradable && (symbolMatch || nameMatch);
  });

  // Limit to top 20 results and return normalized fields
  return results.slice(0, 20).map((asset) => ({
    symbol: asset.symbol,
    name: asset.name,
    exchange: asset.exchange,
    tradable: asset.tradable,
  }));
}

export async function getAssets() {
  const cacheKey = "market:assets:tradable";
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const cacheKeyRaw = "alpaca:assets:us_equity";
  let assetsRaw = await redis.get(cacheKeyRaw);
  let assets: any[];

  if (assetsRaw) {
    assets = JSON.parse(assetsRaw);
  } else {
    assets = await alpaca.getAssets({
      status: "active",
      asset_class: "us_equity",
    });
    await redis.set(cacheKeyRaw, JSON.stringify(assets), "EX", 24 * 60 * 60);
  }

  const tradableAssets = assets
    .filter((asset) => asset.tradable)
    .map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      exchange: asset.exchange,
      tradable: asset.tradable,
    }));

  // Cache for 1 hour (3600 seconds)
  await redis.set(cacheKey, JSON.stringify(tradableAssets), "EX", 3600);
  return tradableAssets;
}
