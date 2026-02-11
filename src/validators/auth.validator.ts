import { z } from 'zod';
import { phoneSchema } from '../utils/phone';

/**
 * Send OTP request schema
 */
export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

/**
 * Verify OTP request schema
 */
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email is too long')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  phone: phoneSchema,
});

export type SendOtpRequest = z.infer<typeof sendOtpSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
