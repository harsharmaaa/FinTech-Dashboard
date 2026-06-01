import { Request, Response, NextFunction } from "express";
import * as alpacaService from "../services/alpaca.service";

export async function getQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol as string;
    if (!symbol) {
      res.status(400).json({
        error: {
          message: "Symbol parameter is required",
          code: "INVALID_INPUT",
        },
      });
      return;
    }
    const quote = await alpacaService.getQuote(symbol);
    res.status(200).json({
      status: "success",
      data: quote,
    });
  } catch (error) {
    next(error);
  }
}

import * as marketDataService from "../services/marketData.service";

export async function getBars(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol as string;
    if (!symbol) {
      res.status(400).json({
        error: {
          message: "Symbol parameter is required",
          code: "INVALID_INPUT",
        },
      });
      return;
    }

    const timeframe = (req.query.timeframe as string) || "1Day";
    const limit = parseInt(req.query.limit as string) || 365;

    // Check TimescaleDB first
    const dbBars = await marketDataService.getOHLCVWithLimit(symbol, timeframe, limit);

    if (dbBars.length >= limit) {
      res.status(200).json({
        status: "success",
        data: { bars: dbBars },
      });
      return;
    }

    // Fallback to Alpaca
    const bars = await alpacaService.getBars(symbol, timeframe, limit);

    // Store in TimescaleDB in the background
    marketDataService.storeOHLCV(symbol, bars, timeframe).catch((err) => {
      console.error(`Failed to background sync historical data for ${symbol}:`, err);
    });

    res.status(200).json({
      status: "success",
      data: { bars },
    });
  } catch (error) {
    next(error);
  }
}

export async function searchSymbols(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({
        error: {
          message: "Query parameter 'q' is required",
          code: "INVALID_INPUT",
        },
      });
      return;
    }

    const results = await alpacaService.searchSymbols(query);
    res.status(200).json({
      status: "success",
      data: { results },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTopMovers(req: Request, res: Response, next: NextFunction) {
  try {
    const movers = await alpacaService.getTopMovers();
    res.status(200).json({
      status: "success",
      data: movers,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Get clock
    const clock = await alpacaService.alpaca.getClock();

    // 2. Fetch indices quotes (SPY, QQQ, DIA, IWM)
    const symbols = ["SPY", "QQQ", "DIA", "IWM"];
    const quotes = await Promise.all(
      symbols.map((sym) => alpacaService.getQuote(sym).catch(() => null))
    );
    const indices = symbols.reduce((acc, sym, i) => {
      acc[sym] = quotes[i];
      return acc;
    }, {} as any);

    // 3. Fetch top movers
    const movers = await alpacaService.getTopMovers().catch(() => ({ gainers: [], losers: [] }));

    res.status(200).json({
      status: "success",
      data: {
        indices,
        topGainers: movers.gainers ? movers.gainers.slice(0, 5) : [],
        topLosers: movers.losers ? movers.losers.slice(0, 5) : [],
        clock: {
          is_open: clock.is_open,
          timestamp: clock.timestamp,
          next_open: clock.next_open,
          next_close: clock.next_close,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getNews(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    // Directly query Alpaca's news API
    const response = await fetch(
      `https://data.alpaca.markets/v1beta1/news?limit=${limit}`,
      {
        headers: {
          "APCA-API-KEY-ID": config.alpaca.keyId,
          "APCA-API-SECRET-KEY": config.alpaca.secretKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch news from Alpaca: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    res.status(200).json({
      status: "success",
      data: data.news || [],
    });
  } catch (error) {
    next(error);
  }
}

import { config } from "../config";

interface MockEarningsEvent {
  symbol: string;
  companyName: string;
  date: string;
  fiscalQuarter: string;
  epsEstimate: string;
  revenueEstimate: string;
  period: string;
}

export async function getEarnings(req: Request, res: Response, next: NextFunction) {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const now = new Date();
    const earnings: MockEarningsEvent[] = [];

    const candidates = [
      "AAPL", "MSFT", "TSLA", "NVDA", "AMZN",
      "GOOGL", "META", "NFLX", "AMD", "QCOM"
    ];
    
    const companyNames: Record<string, string> = {
      AAPL: "Apple Inc.",
      MSFT: "Microsoft Corp.",
      TSLA: "Tesla Inc.",
      NVDA: "NVIDIA Corp.",
      AMZN: "Amazon.com Inc.",
      GOOGL: "Alphabet Inc.",
      META: "Meta Platforms Inc.",
      NFLX: "Netflix Inc.",
      AMD: "Advanced Micro Devices",
      QCOM: "Qualcomm Inc."
    };

    for (let i = 0; i < candidates.length; i++) {
      const symbol = candidates[i] as string;
      const reportDate = new Date();
      // Distribute reporting dates across the requested period
      reportDate.setDate(now.getDate() + (i % days));

      // Exclude weekends
      const dayOfWeek = reportDate.getDay();
      if (dayOfWeek === 0) reportDate.setDate(reportDate.getDate() + 1); // Sunday -> Monday
      if (dayOfWeek === 6) reportDate.setDate(reportDate.getDate() - 1); // Saturday -> Friday

      earnings.push({
        symbol,
        companyName: companyNames[symbol] || "Unknown Corp",
        date: reportDate.toISOString().split("T")[0],
        fiscalQuarter: "Q2 2026",
        epsEstimate: (0.5 + Math.random() * 3.5).toFixed(2),
        revenueEstimate: `${(10 + Math.random() * 90).toFixed(1)}B`,
        period: i % 2 === 0 ? "Before Market" : "After Market"
      });
    }

    // Sort chronologically
    earnings.sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      status: "success",
      data: earnings,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const assets = await alpacaService.getAssets();
    res.status(200).json({
      status: "success",
      data: assets,
    });
  } catch (error) {
    next(error);
  }
}
