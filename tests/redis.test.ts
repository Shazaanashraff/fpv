import { redisService } from '../src/services/redis.service';

describe('Redis Service (In-Memory)', () => {
  beforeEach(async () => {
    await redisService.flushAll();
  });

  describe('setCooldown', () => {
    it('should set cooldown for phone', async () => {
      await redisService.setCooldown('+11234567890');
      const result = await redisService.isInCooldown('+11234567890');
      expect(result.inCooldown).toBe(true);
    });
  });

  describe('isInCooldown', () => {
    it('should return false when not in cooldown', async () => {
      const result = await redisService.isInCooldown('+19999999999');
      expect(result.inCooldown).toBe(false);
    });
  });

  describe('setVerified and isVerified', () => {
    it('should set and get verified status', async () => {
      await redisService.setVerified('+11234567890');
      const result = await redisService.isVerified('+11234567890');
      expect(result).toBe(true);
    });

    it('should return false when not verified', async () => {
      const result = await redisService.isVerified('+19999999999');
      expect(result).toBe(false);
    });
  });

  describe('removeVerification', () => {
    it('should remove verification status', async () => {
      await redisService.setVerified('+11234567890');
      await redisService.removeVerification('+11234567890');
      const result = await redisService.isVerified('+11234567890');
      expect(result).toBe(false);
    });
  });

  describe('isReady', () => {
    it('should return true', () => {
      expect(redisService.isReady()).toBe(true);
    });
  });
});
