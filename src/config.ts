const { PGVectorStore } = require("@llamaindex/postgres");
const { storageContextFromDefaults } = require("llamaindex");
const dotenv = require("dotenv");
const { OpenAI } = require("llamaindex");
const path = require("path");
const redis = require('redis');


dotenv.config({ path: path.resolve(__dirname, '../.env') });


const connectionString = process.env.POSTGRES_URL;


export const pgVectorStore = new PGVectorStore({ clientConfig: { connectionString } });
    
// Function to set the user-specific collection and storage context
export async function getStorageContext(userPhone: string) {
    pgVectorStore.setCollection(`user_${userPhone}`);

    return await storageContextFromDefaults({ vectorStore: pgVectorStore });
}



export const redisClient = redis.createClient({
  url: 'redis://localhost:6379',
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err:any) => {
  console.error('Redis error:', err);
});

// Connect to Redis
redisClient.connect();