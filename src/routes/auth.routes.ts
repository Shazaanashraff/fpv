import { Router } from 'express';
import { sendOtp, verifyOtp, register } from '../controllers/auth.controller';
import { otpLimiter, registrationLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   POST /api/send-otp
 * @desc    Send OTP verification code to phone number
 * @access  Public
 */
router.post('/send-otp', otpLimiter, sendOtp);

/**
 * @route   POST /api/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post('/verify-otp', otpLimiter, verifyOtp);

/**
 * @route   POST /api/register
 * @desc    Register new customer (requires verified phone)
 * @access  Public
 */
router.post('/register', registrationLimiter, register);

export default router;
