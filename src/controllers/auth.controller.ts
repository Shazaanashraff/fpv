import { Request, Response, NextFunction } from 'express';
import { sendOtpSchema, verifyOtpSchema, registerSchema } from '../validators/auth.validator';
import { twilioService } from '../services/twilio.service';
import { shopifyService } from '../services/shopify.service';
import { redisService } from '../services/redis.service';
import { toE164Format, maskPhone } from '../utils/phone';
import { logger } from '../utils/logger';
import { ApiError, asyncHandler } from '../middleware/errorHandler';

/**
 * Send OTP Controller
 * POST /api/send-otp
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  // Validate request
  const { phone } = sendOtpSchema.parse(req.body);

  // Convert to E.164 format
  const phoneE164 = toE164Format(phone);
  logger.info(`Processing send OTP request for ${maskPhone(phoneE164)}`);

  // Check cooldown
  const cooldownStatus = await redisService.isInCooldown(phoneE164);
  if (cooldownStatus.inCooldown) {
    throw new ApiError(
      `Please wait ${cooldownStatus.remainingSeconds} seconds before requesting a new code`,
      429,
      'OTP_COOLDOWN'
    );
  }

  // Check if phone already exists in Shopify
  const existingCustomer = await shopifyService.searchCustomerByPhone(phoneE164);
  if (existingCustomer) {
    throw new ApiError(
      'A customer with this phone number already exists',
      409,
      'PHONE_EXISTS'
    );
  }

  // Send OTP via Twilio
  const result = await twilioService.sendVerification(phoneE164);

  if (!result.success) {
    throw new ApiError(
      result.message || 'Failed to send verification code',
      400,
      'OTP_SEND_FAILED'
    );
  }

  // Set cooldown
  await redisService.setCooldown(phoneE164);

  res.status(200).json({
    success: true,
    message: 'Verification code sent successfully',
    data: {
      phone: maskPhone(phoneE164),
      cooldownSeconds: 60,
    },
  });
});

/**
 * Verify OTP Controller
 * POST /api/verify-otp
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  // Validate request
  const { phone, code } = verifyOtpSchema.parse(req.body);

  // Convert to E.164 format
  const phoneE164 = toE164Format(phone);
  logger.info(`Processing verify OTP request for ${maskPhone(phoneE164)}`);

  // Verify OTP via Twilio
  const result = await twilioService.verifyCode(phoneE164, code);

  if (!result.success) {
    throw new ApiError(
      result.message || 'Invalid verification code',
      400,
      'OTP_VERIFICATION_FAILED'
    );
  }

  // Mark phone as verified in Redis
  await redisService.setVerified(phoneE164);

  // Get TTL for the verification
  const ttl = await redisService.getVerificationTtl(phoneE164);

  res.status(200).json({
    success: true,
    message: 'Phone number verified successfully',
    data: {
      phone: maskPhone(phoneE164),
      verified: true,
      expiresInSeconds: ttl,
    },
  });
});

/**
 * Register Controller
 * POST /api/register
 */
export const register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  // Validate request
  const { firstName, lastName, email, password, phone } = registerSchema.parse(req.body);

  // Convert to E.164 format
  const phoneE164 = toE164Format(phone);
  logger.info(`Processing registration request for ${email}`);

  // Check if phone is verified
  const isVerified = await redisService.isVerified(phoneE164);
  if (!isVerified) {
    throw new ApiError(
      'Phone number must be verified before registration',
      403,
      'PHONE_NOT_VERIFIED'
    );
  }

  // Check for duplicate phone in Shopify
  const existingByPhone = await shopifyService.searchCustomerByPhone(phoneE164);
  if (existingByPhone) {
    throw new ApiError(
      'A customer with this phone number already exists',
      409,
      'PHONE_EXISTS'
    );
  }

  // Check for duplicate email in Shopify
  const existingByEmail = await shopifyService.searchCustomerByEmail(email);
  if (existingByEmail) {
    throw new ApiError(
      'A customer with this email already exists',
      409,
      'EMAIL_EXISTS'
    );
  }

  // Create customer in Shopify with metafields
  const customer = await shopifyService.registerCustomer({
    firstName,
    lastName,
    email,
    password,
    phone: phoneE164,
  });

  // Remove verification status from Redis
  await redisService.removeVerification(phoneE164);

  logger.info(`Customer registered successfully: ${customer.id}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: maskPhone(phoneE164),
    },
  });
});
