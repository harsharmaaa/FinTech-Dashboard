import { WebSocket } from "ws";
import * as alpacaStream from "./alpacaStream";

// Map: symbol -> Set of WebSocket clients
const subscriptions = new Map<string, Set<WebSocket>>();

export function subscribe(client: WebSocket, symbols: string[]) {
  for (const sym of symbols) {
    const symbol = sym.toUpperCase().trim();
    if (!subscriptions.has(symbol)) {
      subscriptions.set(symbol, new Set());
    }

    const clientSet = subscriptions.get(symbol)!;
    if (!clientSet.has(client)) {
      clientSet.add(client);
      // If subscriber count goes from 0 to 1, subscribe on Alpaca stream
      if (clientSet.size === 1) {
        alpacaStream.subscribeSymbol(symbol);
      }
    }
  }
}

export function unsubscribe(client: WebSocket, symbols: string[]) {
  for (const sym of symbols) {
    const symbol = sym.toUpperCase().trim();
    const clientSet = subscriptions.get(symbol);
    if (clientSet && clientSet.has(client)) {
      clientSet.delete(client);
      // If subscriber count drops to 0, unsubscribe from Alpaca stream
      if (clientSet.size === 0) {
        subscriptions.delete(symbol);
        alpacaStream.unsubscribeSymbol(symbol);
      }
    }
  }
}

export function removeClient(client: WebSocket) {
  for (const [symbol, clientSet] of subscriptions.entries()) {
    if (clientSet.has(client)) {
      clientSet.delete(client);
      if (clientSet.size === 0) {
        subscriptions.delete(symbol);
        alpacaStream.unsubscribeSymbol(symbol);
      }
    }
  }
}

export function broadcast(symbol: string, data: any) {
  const upperSymbol = symbol.toUpperCase().trim();
  const clientSet = subscriptions.get(upperSymbol);
  console.log(`[SubscriptionManager] Broadcast request for ${upperSymbol}. Found active clients: ${clientSet ? clientSet.size : 0}`);
  if (clientSet && clientSet.size > 0) {
    const payload = JSON.stringify({
      type: "quote",
      symbol: upperSymbol,
      price: data.price,
      change: data.change,
      timestamp: data.timestamp,
    });
    for (const client of clientSet) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          console.log(`[SubscriptionManager] Sending quote to client.`);
          client.send(payload);
        } catch (err) {
          console.error(`[SubscriptionManager] Error writing quote to client socket:`, err);
        }
      } else {
        console.warn(`[SubscriptionManager] Client socket not open. State: ${client.readyState}`);
      }
    }
  }
}
