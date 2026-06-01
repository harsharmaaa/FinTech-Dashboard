import { ConnectionOptions } from "bullmq";
import { config } from "../config";

const redisUrl = new URL(config.redis.url);

export const connection: ConnectionOptions = {
  host: redisUrl.hostname || "localhost",
  port: parseInt(redisUrl.port) || 6379,
  maxRetriesPerRequest: null,
};
