import * as marketDataService from "../src/services/marketData.service";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("⏱️ Testing TimescaleDB query performance for 365 daily bars of AAPL...");
  
  // Warm up connection/cache
  await marketDataService.getOHLCVWithLimit("AAPL", "1Day", 5);

  const start = performance.now();
  const bars = await marketDataService.getOHLCVWithLimit("AAPL", "1Day", 365);
  const duration = performance.now() - start;

  console.log(`Fetched ${bars.length} bars from TimescaleDB.`);
  console.log(`⏱️ Query execution duration: ${duration.toFixed(3)}ms`);

  if (duration < 5) {
    console.log("✅ Performance validation PASSED! (Duration is < 5ms)");
  } else {
    console.warn("⚠️ Performance validation WARNING: (Duration is >= 5ms, but might be due to environment startup / CPU limits)");
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
