import { Worker, Job } from "bullmq";
import { connection } from "./connection";
import { TICKERS } from "../config/tickers";
import * as alpacaService from "../services/alpaca.service";
import * as marketDataService from "../services/marketData.service";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const marketDataWorker = new Worker(
  "market-data",
  async (job: Job) => {
    if (job.name === "DailyOHLCVJob") {
      console.log("🎬 Starting DailyOHLCVJob: Syncing latest daily bars for 50 tickers...");

      let count = 0;
      for (const symbol of TICKERS) {
        count++;
        try {
          console.log(`[Job] [${count}/${TICKERS.length}] Fetching latest daily bar for ${symbol}...`);
          
          // Fetch the latest 1 day bar (limit = 1)
          const bars = await alpacaService.getBars(symbol, "1Day", 1);
          
          if (bars.length > 0) {
            await marketDataService.storeOHLCV(symbol, bars, "1Day");
            console.log(`[Job] ✅ Successfully stored ${symbol} daily bar.`);
          } else {
            console.warn(`[Job] ⚠️ No bar returned for ${symbol}.`);
          }
        } catch (error) {
          console.error(`[Job] ❌ Error syncing data for ${symbol}:`, error);
        }

        // Avoid hitting API limits
        await sleep(300);
      }
      console.log("🎉 DailyOHLCVJob finished successfully!");
    }
  },
  { connection }
);

marketDataWorker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed.`);
});

marketDataWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});
