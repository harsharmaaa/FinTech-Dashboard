import WebSocket from "ws";
import { config } from "../config";
import { redis } from "../lib/redis";
import * as marketDataService from "../services/marketData.service";

const ALPACA_WS_URL = "wss://stream.data.alpaca.markets/v2/iex";

let ws: WebSocket | null = null;
let isAuthenticated = false;
const activeSymbols = new Set<string>();

// Cache yesterday's close price to avoid DB lookups on every packet
const prevCloseCache = new Map<string, number>();

export function initAlpacaStream() {
  if (ws) return;

  console.log("Connecting upstream to Alpaca Market Data WebSocket...");
  ws = new WebSocket(ALPACA_WS_URL);

  ws.on("open", () => {
    console.log("Alpaca WebSocket connection opened.");
  });

  ws.on("message", async (data) => {
    try {
      const messages = JSON.parse(data.toString());
      if (!Array.isArray(messages)) return;

      for (const msg of messages) {
        if (msg.T === "success" && msg.msg === "connected") {
          console.log("Alpaca Stream connected. Authenticating...");
          ws?.send(
            JSON.stringify({
              action: "auth",
              key: config.alpaca.keyId,
              secret: config.alpaca.secretKey,
            })
          );
        } else if (msg.T === "success" && msg.msg === "authenticated") {
          console.log("Alpaca Stream authenticated successfully!");
          isAuthenticated = true;
          
          // Re-subscribe to all active symbols on reconnect
          if (activeSymbols.size > 0) {
            const symbolsArray = Array.from(activeSymbols);
            console.log(`Re-subscribing to quotes for: ${symbolsArray.join(", ")}`);
            ws?.send(
              JSON.stringify({
                action: "subscribe",
                quotes: symbolsArray,
              })
            );
          }
        } else if (msg.T === "q") {
          // Process quote update
          const symbol = msg.S;
          const bid = msg.bp || 0;
          const ask = msg.ap || 0;
          const price = bid > 0 && ask > 0 ? (bid + ask) / 2 : bid || ask || 0;
          const timestamp = msg.t;

          let prevClose: number;
          const cachedClose = prevCloseCache.get(symbol);
          if (cachedClose === undefined) {
            try {
              const latestPrice = await marketDataService.getLatestPrice(symbol);
              prevClose = latestPrice !== null ? latestPrice : price;
              prevCloseCache.set(symbol, prevClose);
            } catch (err) {
              console.error(`Failed to fetch prevClose for ${symbol}:`, err);
              prevClose = price;
            }
          } else {
            prevClose = cachedClose;
          }

          const change = prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;

          const quotePayload = {
            symbol,
            price,
            change,
            timestamp,
          };

          // Publish to Redis channel
          await redis.publish(`quotes:${symbol}`, JSON.stringify(quotePayload));
        } else if (msg.T === "error") {
          console.error("Alpaca Stream Error response:", msg);
        }
      }
    } catch (err) {
      console.error("Error processing Alpaca message:", err);
    }
  });

  ws.on("close", (code, reason) => {
    console.log(`Alpaca WebSocket closed. Code: ${code}, Reason: ${reason}. Retrying in 5 seconds...`);
    ws = null;
    isAuthenticated = false;
    setTimeout(initAlpacaStream, 5000);
  });

  ws.on("error", (err) => {
    console.error("Alpaca WebSocket error:", err);
    ws?.close();
  });
}

export function subscribeSymbol(symbol: string) {
  const upper = symbol.toUpperCase().trim();
  if (activeSymbols.has(upper)) return;

  activeSymbols.add(upper);

  if (isAuthenticated && ws && ws.readyState === WebSocket.OPEN) {
    console.log(`Subscribing upstream to Alpaca for quote updates of: ${upper}`);
    ws.send(
      JSON.stringify({
        action: "subscribe",
        quotes: [upper],
      })
    );
  }
}

export function unsubscribeSymbol(symbol: string) {
  const upper = symbol.toUpperCase().trim();
  if (!activeSymbols.has(upper)) return;

  activeSymbols.delete(upper);
  prevCloseCache.delete(upper);

  if (isAuthenticated && ws && ws.readyState === WebSocket.OPEN) {
    console.log(`Unsubscribing upstream from Alpaca for quote updates of: ${upper}`);
    ws.send(
      JSON.stringify({
        action: "unsubscribe",
        quotes: [upper],
      })
    );
  }
}

// Graceful release of Alpaca WebSocket connection on reload/exit
process.on("SIGINT", () => {
  if (ws) {
    console.log("Closing Alpaca WS connection on SIGINT...");
    ws.close();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (ws) {
    console.log("Closing Alpaca WS connection on SIGTERM...");
    ws.close();
  }
  process.exit(0);
});
