import { Redis } from "ioredis";
import { config } from "../src/config";

async function main() {
  const url = new URL(config.redis.url);
  const host = url.hostname || "localhost";
  const port = parseInt(url.port) || 6379;

  console.log(`Testing Redis Pub/Sub on ${host}:${port}...`);

  const sub = new Redis({ host, port, enableReadyCheck: false });
  const pub = new Redis({ host, port });

  sub.on("ready", () => {
    console.log("Subscriber ready. Subscribing...");
    sub.psubscribe("quotes:*", (err, count) => {
      if (err) {
        console.error("Sub error:", err);
      } else {
        console.log(`Subscribed. Active count: ${count}`);
        
        // Publish a message
        setTimeout(async () => {
          console.log("Publishing message...");
          await pub.publish("quotes:AAPL", JSON.stringify({ test: "hello" }));
        }, 1000);
      }
    });
  });

  sub.on("pmessage", (pattern, channel, message) => {
    console.log(`🔔 Received pmessage: Pattern: ${pattern}, Channel: ${channel}, Message: ${message}`);
    // Clean up
    sub.quit();
    pub.quit();
  });
}

main().catch(console.error);
