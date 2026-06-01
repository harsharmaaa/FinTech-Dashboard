import * as alpacaService from "../src/services/alpaca.service";
import * as marketDataService from "../src/services/marketData.service";
import { prisma } from "../src/lib/prisma";

const TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "V", "JNJ", "WMT",
  "UNH", "MA", "PG", "JPM", "XOM", "LLY", "AVGO", "HD", "CVX", "MRK",
  "ABBV", "PEP", "COST", "KO", "ADBE", "MCD", "WFC", "BAC", "CSCO", "TMO",
  "CRM", "ORCL", "PFE", "ACN", "ABT", "CMCSA", "DIS", "NFLX", "AMD", "TXN",
  "AMGN", "NKE", "PM", "HON", "SCHW", "QCOM", "GE", "INTU", "SBUX", "DE"
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log(`🚀 Starting seeding historical data for ${TICKERS.length} tickers...`);
  
  let i = 0;
  for (const symbol of TICKERS) {
    i++;
    console.log(`[${i}/${TICKERS.length}] Fetching 2 years of daily data for ${symbol}...`);
    try {
      // Fetch 730 days (~2 years) of data from Alpaca
      const bars = await alpacaService.getBars(symbol, "1Day", 730);
      console.log(`Fetched ${bars.length} bars for ${symbol}. Storing in TimescaleDB...`);
      
      // Store in TimescaleDB
      await marketDataService.storeOHLCV(symbol, bars, "1Day");
      console.log(`✅ Stored ${symbol} successfully.`);
      
      // Prevent hitting Alpaca rate limits
      await sleep(300);
    } catch (error) {
      console.error(`❌ Error seeding data for ${symbol}:`, error);
    }
  }

  console.log("🎉 Seeding completed!");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
