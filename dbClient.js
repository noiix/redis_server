import { createClient } from 'redis'

// Pull the Redis URL from .env
const url = process.env.REDIS_URL

const dbClient = createClient({url});

dbClient.on('error', err => console.log('Redis Client Error', err));

await dbClient.connect();

export default dbClient;

