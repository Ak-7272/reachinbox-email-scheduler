import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set in .env");
}

// This client we will use ourselves (for rate limiting etc.)
export const redisClient = new Redis(redisUrl);
