import { Redis } from "ioredis";
import { config } from "../config";
import * as subscriptionManager from "./subscriptionManager";

let redisSub: Redis | null = null;

export function initQuotePublisher() {
  if (redisSub) return;

  const url = new URL(config.redis.url);
  redisSub = new Redis({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 6379,
    enableReadyCheck: false,
  });

  redisSub.on("ready", () => {
    console.log("Redis Pub/Sub Subscriber ready");
    // Pattern subscribe to quotes:*
    redisSub?.psubscribe("quotes:*", (err, count) => {
      if (err) {
        console.error("Failed to psubscribe to quotes:* channels:", err);
      } else {
        console.log(`Subscribed to quotes:* channels. Active count: ${count}`);
      }
    });
  });

  redisSub.on("pmessage", (pattern, channel, message) => {
    try {
      console.log(`[PubSub] Message received on channel ${channel}: ${message}`);
      const symbol = channel.split(":")[1];
      if (symbol) {
        const data = JSON.parse(message);
        subscriptionManager.broadcast(symbol, data);
      }
    } catch (err) {
      console.error("Failed to process pub/sub message:", err);
    }
  });

  redisSub.on("error", (err) => {
    console.error("Redis Pub/Sub Subscriber error:", err);
  });
}
