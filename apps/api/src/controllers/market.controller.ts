import { Request, Response, NextFunction } from "express";
import * as alpacaService from "../services/alpaca.service";

export async function getQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
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

export async function getBars(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
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

    const bars = await alpacaService.getBars(symbol, timeframe, limit);
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
