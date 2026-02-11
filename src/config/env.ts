import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // CORS - comma-separated list of allowed origins
  CORS_ORIGINS: z.string().default('*'),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1, 'TWILIO_ACCOUNT_SID is required'),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'TWILIO_AUTH_TOKEN is required'),
  TWILIO_VERIFY_SERVICE_SID: z.string().min(1, 'TWILIO_VERIFY_SERVICE_SID is required'),

  // Shopify
  SHOPIFY_STORE_URL: z.string().min(1, 'SHOPIFY_STORE_URL is required'),
  SHOPIFY_ADMIN_API_ACCESS_TOKEN: z.string().default(''),
  SHOPIFY_API_VERSION: z.string().default('2024-01'),
  
  // Shopify OAuth (optional - for auto-refresh tokens)
  SHOPIFY_CLIENT_ID: z.string().optional(),
  SHOPIFY_CLIENT_SECRET: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('10'),

  // OTP Configuration
  OTP_COOLDOWN_SECONDS: z.string().default('60'),
  OTP_VERIFICATION_TTL_SECONDS: z.string().default('600'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

const envVars = parseEnv();

export const config = {
  port: parseInt(envVars.PORT, 10),
  nodeEnv: envVars.NODE_ENV,
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',

  // CORS origins - parse comma-separated list or use '*' for all
  corsOrigins: envVars.CORS_ORIGINS === '*' 
    ? '*' as const
    : envVars.CORS_ORIGINS.split(',').map(origin => origin.trim()),

  twilio: {
    accountSid: envVars.TWILIO_ACCOUNT_SID,
    authToken: envVars.TWILIO_AUTH_TOKEN,
    verifyServiceSid: envVars.TWILIO_VERIFY_SERVICE_SID,
  },

  shopify: {
    storeUrl: envVars.SHOPIFY_STORE_URL,
    accessToken: envVars.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    apiVersion: envVars.SHOPIFY_API_VERSION,
    clientId: envVars.SHOPIFY_CLIENT_ID,
    clientSecret: envVars.SHOPIFY_CLIENT_SECRET,
  },

  rateLimit: {
    windowMs: parseInt(envVars.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(envVars.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  otp: {
    cooldownSeconds: parseInt(envVars.OTP_COOLDOWN_SECONDS, 10),
    verificationTtlSeconds: parseInt(envVars.OTP_VERIFICATION_TTL_SECONDS, 10),
  },
};

export type Config = typeof config;
