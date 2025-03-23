import { PGVectorStore } from "@llamaindex/postgres";
import { storageContextFromDefaults, OpenAI } from "llamaindex";
import dotenv from "dotenv";
import path from "path";
import * as redis from "redis";



dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectionString = process.env.POSTGRES_URL;

export const pgVectorStore = new PGVectorStore({
  clientConfig: { connectionString },
});

export async function getStorageContext(userPhone: string) {
  pgVectorStore.setCollection(`user_${userPhone}`);

  return await storageContextFromDefaults({ vectorStore: pgVectorStore });
}




export const MAYTAPI_API_URL = `https://api.maytapi.com/api/${process.env.MAYTAPI_PRODUCT_ID}/${process.env.MAYTAPI_INSTANCE_ID}`;
export const MAYTAPI_TOKEN = process.env.MAYTAPI_TOKEN;


export const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err: any) => {
  console.error("Redis error:", err);
});

// Connect to Redis
redisClient.connect();
