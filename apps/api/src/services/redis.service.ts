import Redis from 'ioredis';

class RedisService {
    private client: Redis;
    private isConnected = false;

    constructor() {
        this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
            lazyConnect: true,
            maxRetriesPerRequest: 2,
            enableOfflineQueue: false,
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('[Redis] Connected');
        });
        this.client.on('error', (err) => {
            this.isConnected = false;
            console.warn('[Redis] Error — using fallback:', err.message);
        });
    }

    async get(key: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try { return await this.client.get(key); }
        catch { return null; }
    }

    async setex(key: string, ttl: number, value: string): Promise<void> {
        if (!this.isConnected) return;
        try { await this.client.setex(key, ttl, value); }
        catch { /* silent fallback */ }
    }

    async del(key: string): Promise<void> {
        try { await this.client.del(key); }
        catch { /* silent */ }
    }
}

export const redisService = new RedisService();
