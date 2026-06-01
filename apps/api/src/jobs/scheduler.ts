import { Queue } from "bullmq";
import { connection } from "./connection";

export const marketDataQueue = new Queue("market-data", { connection });

export async function scheduleDailySync() {
  // Clean up any old repeatable jobs for DailyOHLCVJob first to avoid duplicates
  const repeatableJobs = await marketDataQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === "DailyOHLCVJob") {
      await marketDataQueue.removeRepeatableByKey(job.key);
    }
  }

  await marketDataQueue.add(
    "DailyOHLCVJob",
    {},
    {
      repeat: {
        pattern: "0 23 * * *", // Runs daily at 11 PM UTC (6 PM EST)
      },
    }
  );
  console.log("⏰ DailyOHLCVJob scheduled with cron '0 23 * * *'");
}
