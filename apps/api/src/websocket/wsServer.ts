import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyAccessToken } from "../lib/jwt";
import { subscribe, unsubscribe, removeClient } from "./subscriptionManager";

export function initWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket & { authenticated?: boolean }) => {
    console.log("New WebSocket client connected.");
    ws.authenticated = false;

    const safeSend = (payload: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(payload));
        } catch (err) {
          console.error("WS safeSend error:", err);
        }
      }
    };

    ws.on("message", async (rawData) => {
      try {
        const message = JSON.parse(rawData.toString());

        if (!ws.authenticated) {
          if (message.action === "auth" && message.token) {
            try {
              verifyAccessToken(message.token);
              ws.authenticated = true;
              safeSend({ type: "auth", status: "success" });
              console.log("WebSocket client authenticated successfully.");
            } catch (err) {
              safeSend({ type: "error", message: "Unauthorized" });
              ws.close(4001, "Unauthorized");
            }
          } else {
            safeSend({ type: "error", message: "Unauthenticated" });
            ws.close(4000, "Unauthenticated");
          }
          return;
        }

        // Handle subscriptions for authenticated clients
        if (message.action === "subscribe" && Array.isArray(message.symbols)) {
          console.log(`Client subscribing to: ${message.symbols.join(", ")}`);
          subscribe(ws, message.symbols);
        } else if (message.action === "unsubscribe" && Array.isArray(message.symbols)) {
          console.log(`Client unsubscribing from: ${message.symbols.join(", ")}`);
          unsubscribe(ws, message.symbols);
        } else {
          safeSend({ type: "error", message: "Invalid action or format" });
        }
      } catch (err) {
        safeSend({ type: "error", message: "Invalid JSON" });
      }
    });

    ws.on("close", (code, reason) => {
      console.log(`Client disconnected. Code: ${code}, Reason: ${reason}`);
      removeClient(ws);
    });

    ws.on("error", (err) => {
      console.error("WS client error:", err);
      removeClient(ws);
    });
  });

  console.log("🔌 WebSocket server attached to HTTP server at /ws");
}
