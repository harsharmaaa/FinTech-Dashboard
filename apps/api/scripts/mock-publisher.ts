import { Redis } from "ioredis";
import { config } from "../src/config";

async function main() {
  const url = new URL(config.redis.url);
  const redis = new Redis({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 6379,
  });

  console.log("Mock publisher starting. Waiting 4 seconds...");
  await new Promise((resolve) => setTimeout(resolve, 4000));

  const mockQuote = {
    symbol: "AAPL",
    price: 185.75,
    change: 1.45,
    timestamp: new Date().toISOString(),
  };

  console.log("Publishing mock quote to quotes:AAPL...");
  await redis.publish("quotes:AAPL", JSON.stringify(mockQuote));
  console.log("Mock quote published successfully! ✅");

  await redis.quit();
}

main().catch(console.error);
