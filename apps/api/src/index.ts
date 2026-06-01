import { app } from "./app";
import { config } from "./config";
import { scheduleDailySync } from "./jobs/scheduler";
import "./jobs/worker";

import { initWebSocketServer } from "./websocket/wsServer";
import { initAlpacaStream } from "./websocket/alpacaStream";
import { initQuotePublisher } from "./websocket/quotePublisher";

const PORT = config.port;

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize WebSocket components
  initWebSocketServer(server);
  initAlpacaStream();
  initQuotePublisher();

  try {
    await scheduleDailySync();
  } catch (error) {
    console.error("Failed to schedule daily sync job:", error);
  }
});