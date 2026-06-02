"use client";

import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";

export interface WebSocketContextType {
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  lastMessage: any;
  isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const token = useAuthStore((state) => state.accessToken);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef(1000); // Start with 1s

  // Map: symbol -> reference count (number of active component subscriptions)
  const subscriptionCountsRef = useRef<Map<string, number>>(new Map());
  
  // Track successful authentication on current socket
  const isAuthSuccessfulRef = useRef(false);

  // Derive WebSocket URL from current NEXT_PUBLIC_API_URL
  const apiUrL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const WS_URL = apiUrL.replace(/^http/, "ws") + "/ws";

  const connect = () => {
    if (!token) {
      console.log("[WS] No access token found. WebSocket will wait to connect.");
      return;
    }

    if (socketRef.current) {
      return;
    }

    console.log("[WS] Connecting to WebSocket server...");
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connection opened. Authenticating...");
      // Authenticate immediately as the first packet
      ws.send(JSON.stringify({ action: "auth", token }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "auth") {
          if (message.status === "success") {
            console.log("[WS] Authentication successful!");
            isAuthSuccessfulRef.current = true;
            setIsConnected(true);
            backoffRef.current = 1000; // Reset backoff on success

            // Re-subscribe to all active symbols with a ref count > 0
            const activeSymbols = Array.from(subscriptionCountsRef.current.keys());
            if (activeSymbols.length > 0) {
              console.log(`[WS] Re-subscribing to: ${activeSymbols.join(", ")}`);
              ws.send(JSON.stringify({ action: "subscribe", symbols: activeSymbols }));
            }
          } else {
            console.error("[WS] Authentication failed:", message.message);
            ws.close();
          }
        } else if (message.type === "quote") {
          setLastMessage(message);
        } else if (message.type === "error") {
          console.error("[WS] Error message from server:", message.message);
        }
      } catch (err) {
        console.error("[WS] Error parsing message:", err);
      }
    };

    ws.onclose = (event) => {
      console.log(`[WS] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
      socketRef.current = null;
      setIsConnected(false);
      isAuthSuccessfulRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Reconnect with exponential backoff if token is still valid
      if (token) {
        console.log(`[WS] Reconnecting in ${backoffRef.current}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, backoffRef.current);
        
        backoffRef.current = Math.min(backoffRef.current * 2, 30000);
      }
    };

    ws.onerror = (error) => {
      console.error("[WS] Connection error:", error);
      ws.close();
    };
  };

  const subscribe = useCallback((symbols: string[]) => {
    const toSubscribe: string[] = [];

    for (const sym of symbols) {
      const symbol = sym.toUpperCase().trim();
      const currentCount = subscriptionCountsRef.current.get(symbol) || 0;
      subscriptionCountsRef.current.set(symbol, currentCount + 1);

      if (currentCount === 0) {
        toSubscribe.push(symbol);
      }
    }

    if (toSubscribe.length > 0 && socketRef.current && socketRef.current.readyState === WebSocket.OPEN && isAuthSuccessfulRef.current) {
      console.log(`[WS] Subscribing to: ${toSubscribe.join(", ")}`);
      try {
        socketRef.current.send(JSON.stringify({ action: "subscribe", symbols: toSubscribe }));
      } catch (err) {
        console.error("[WS] Error sending subscribe message:", err);
      }
    }
  }, []);

  const unsubscribe = useCallback((symbols: string[]) => {
    const toUnsubscribe: string[] = [];

    for (const sym of symbols) {
      const symbol = sym.toUpperCase().trim();
      const currentCount = subscriptionCountsRef.current.get(symbol) || 0;
      if (currentCount <= 0) continue;

      const newCount = currentCount - 1;
      if (newCount === 0) {
        subscriptionCountsRef.current.delete(symbol);
        toUnsubscribe.push(symbol);
      } else {
        subscriptionCountsRef.current.set(symbol, newCount);
      }
    }

    if (toUnsubscribe.length > 0 && socketRef.current && socketRef.current.readyState === WebSocket.OPEN && isAuthSuccessfulRef.current) {
      console.log(`[WS] Unsubscribing from: ${toUnsubscribe.join(", ")}`);
      try {
        socketRef.current.send(JSON.stringify({ action: "unsubscribe", symbols: toUnsubscribe }));
      } catch (err) {
        console.error("[WS] Error sending unsubscribe message:", err);
      }
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        console.log("[WS] Cleaning up and closing WebSocket...");
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ subscribe, unsubscribe, lastMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
