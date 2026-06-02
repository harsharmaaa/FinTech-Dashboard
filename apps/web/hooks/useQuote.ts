import { useEffect, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { api } from "../services/api";

export interface QuoteData {
  price: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  volume: number;
  isLoading: boolean;
}

export function useQuote(symbol: string) {
  const { subscribe, unsubscribe, lastMessage } = useWebSocket();
  const [quote, setQuote] = useState<QuoteData>({
    price: 0,
    change: 0,
    changePercent: 0,
    bid: 0,
    ask: 0,
    volume: 0,
    isLoading: true,
  });

  const upperSymbol = symbol.toUpperCase().trim();

  // 1. Fetch initial quote snapshot via REST API
  useEffect(() => {
    let active = true;
    async function fetchInitialQuote() {
      try {
        const res = await api.get(`/api/v1/market/quote/${upperSymbol}`);
        const data = res.data.data;
        if (active) {
          setQuote({
            price: data.lastPrice || 0,
            change: data.lastPrice * (data.changePercent / 100) || 0,
            changePercent: data.changePercent || 0,
            bid: data.bidPrice || 0,
            ask: data.askPrice || 0,
            volume: data.volume || 0,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error(`Error fetching initial quote for ${upperSymbol}:`, err);
        if (active) {
          setQuote((q) => ({ ...q, isLoading: false }));
        }
      }
    }

    fetchInitialQuote();
    return () => {
      active = false;
    };
  }, [upperSymbol]);

  // 2. Subscribe to WebSocket updates
  useEffect(() => {
    subscribe([upperSymbol]);
    return () => {
      unsubscribe([upperSymbol]);
    };
  }, [upperSymbol, subscribe, unsubscribe]);

  // 3. Listen for WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.symbol.toUpperCase() === upperSymbol) {
      // Re-calculate absolute change from the live percentage change and current price
      const price = lastMessage.price;
      const changePercent = lastMessage.change;
      const change = price * (changePercent / 100);

      setQuote({
        price,
        change,
        changePercent,
        bid: lastMessage.bid || 0,
        ask: lastMessage.ask || 0,
        volume: lastMessage.volume || 0,
        isLoading: false,
      });
    }
  }, [lastMessage, upperSymbol]);

  return quote;
}
