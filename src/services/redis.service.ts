import { config } from '../config/env';
import { logger } from '../utils/logger';

const memoryStore = new Map<string, { value: string; expiresAt: number }>();

// Cleanup interval - skip in test environment
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
if (!config.isTest) {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of memoryStore.entries()) {
      if (data.expiresAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}

class RedisService {
  private async setex(key: string, seconds: number, value: string): Promise<void> {
    memoryStore.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000,
    });
  }

  private async get(key: string): Promise<string | null> {
    const data = memoryStore.get(key);
    if (!data) return null;
    if (data.expiresAt < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return data.value;
  }

  private async ttl(key: string): Promise<number> {
    const data = memoryStore.get(key);
    if (!data) return -2;
    const remaining = Math.ceil((data.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  private async del(key: string): Promise<void> {
    memoryStore.delete(key);
  }

  async setCooldown(phone: string): Promise<void> {
    const key = `cooldown:${phone}`;
    await this.setex(key, config.otp.cooldownSeconds, Date.now().toString());
    logger.debug(`Cooldown set for ${phone}`);
  }

  async isInCooldown(phone: string): Promise<{ inCooldown: boolean; remainingSeconds: number }> {
    const key = `cooldown:${phone}`;
    const ttlValue = await this.ttl(key);
    if (ttlValue > 0) {
      return { inCooldown: true, remainingSeconds: ttlValue };
    }
    return { inCooldown: false, remainingSeconds: 0 };
  }

  async setVerified(phone: string): Promise<void> {
    const key = `verified:${phone}`;
    await this.setex(key, config.otp.verificationTtlSeconds, 'true');
    logger.debug(`Phone verified: ${phone}`);
  }

  async isVerified(phone: string): Promise<boolean> {
    const key = `verified:${phone}`;
    const result = await this.get(key);
    return result === 'true';
  }

  async removeVerification(phone: string): Promise<void> {
    const key = `verified:${phone}`;
    await this.del(key);
  }

  async removeCooldown(phone: string): Promise<void> {
    const key = `cooldown:${phone}`;
    await this.del(key);
  }

  async getVerificationTtl(phone: string): Promise<number> {
    const key = `verified:${phone}`;
    return await this.ttl(key);
  }

  isReady(): boolean {
    return true;
  }

  async disconnect(): Promise<void> {
    logger.info('Memory store cleared');
  }

  async flushAll(): Promise<void> {
    if (config.isTest) {
      memoryStore.clear();
    }
  }
}

export const redisService = new RedisService();
