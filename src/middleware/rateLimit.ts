import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { logger } from '../utils/logger';

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  skip: () => config.isTest, // Skip rate limiting in tests
});

/**
 * Stricter rate limiter for OTP endpoints
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: {
    success: false,
    error: {
      code: 'OTP_RATE_LIMIT_EXCEEDED',
      message: 'Too many OTP requests, please wait before trying again',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by phone number if available, otherwise by IP
    return req.body?.phone || req.ip;
  },
  handler: (req, res, next, options) => {
    logger.warn(`OTP rate limit exceeded for: ${req.body?.phone || req.ip}`);
    res.status(429).json(options.message);
  },
  skip: () => config.isTest, // Skip rate limiting in tests
});

/**
 * Stricter rate limiter for registration endpoint
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registration attempts per hour
  message: {
    success: false,
    error: {
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      message: 'Too many registration attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  skip: () => config.isTest, // Skip rate limiting in tests
});
