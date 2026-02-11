import request from 'supertest';
import express, { Application } from 'express';
import { createApp } from '../src/app';
import { redisService } from '../src/services/redis.service';
import { twilioService } from '../src/services/twilio.service';
import { shopifyService } from '../src/services/shopify.service';

// Mock the services
jest.mock('../src/services/redis.service');
jest.mock('../src/services/twilio.service');
jest.mock('../src/services/shopify.service');

describe('Auth Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/send-otp', () => {
    const validPhone = '+11234567890';

    it('should send OTP successfully', async () => {
      // Mock Redis - no cooldown
      (redisService.isInCooldown as jest.Mock).mockResolvedValue({
        inCooldown: false,
        remainingSeconds: 0,
      });
      (redisService.setCooldown as jest.Mock).mockResolvedValue(undefined);

      // Mock Shopify - no existing customer
      (shopifyService.searchCustomerByPhone as jest.Mock).mockResolvedValue(null);

      // Mock Twilio - success
      (twilioService.sendVerification as jest.Mock).mockResolvedValue({
        success: true,
        status: 'pending',
      });

      const response = await request(app)
        .post('/api/send-otp')
        .send({ phone: validPhone })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Verification code sent successfully');
      expect(redisService.setCooldown).toHaveBeenCalled();
    });

    it('should reject when phone is in cooldown', async () => {
      (redisService.isInCooldown as jest.Mock).mockResolvedValue({
        inCooldown: true,
        remainingSeconds: 45,
      });

      const response = await request(app)
        .post('/api/send-otp')
        .send({ phone: validPhone })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('OTP_COOLDOWN');
    });

    it('should reject duplicate phone number', async () => {
      (redisService.isInCooldown as jest.Mock).mockResolvedValue({
        inCooldown: false,
        remainingSeconds: 0,
      });

      (shopifyService.searchCustomerByPhone as jest.Mock).mockResolvedValue({
        id: 123,
        email: 'existing@example.com',
      });

      const response = await request(app)
        .post('/api/send-otp')
        .send({ phone: validPhone })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHONE_EXISTS');
    });

    it('should validate phone number format', async () => {
      const response = await request(app)
        .post('/api/send-otp')
        .send({ phone: '123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle Twilio send failure', async () => {
      (redisService.isInCooldown as jest.Mock).mockResolvedValue({
        inCooldown: false,
        remainingSeconds: 0,
      });
      (shopifyService.searchCustomerByPhone as jest.Mock).mockResolvedValue(null);
      (twilioService.sendVerification as jest.Mock).mockResolvedValue({
        success: false,
        status: 'error',
        message: 'Failed to send',
      });

      const response = await request(app)
        .post('/api/send-otp')
        .send({ phone: validPhone })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('OTP_SEND_FAILED');
    });
  });

  describe('POST /api/verify-otp', () => {
    const validPhone = '+11234567890';
    const validCode = '123456';

    it('should verify OTP successfully', async () => {
      (twilioService.verifyCode as jest.Mock).mockResolvedValue({
        success: true,
        status: 'approved',
      });
      (redisService.setVerified as jest.Mock).mockResolvedValue(undefined);
      (redisService.getVerificationTtl as jest.Mock).mockResolvedValue(600);

      const response = await request(app)
        .post('/api/verify-otp')
        .send({ phone: validPhone, code: validCode })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true);
      expect(redisService.setVerified).toHaveBeenCalled();
    });

    it('should reject invalid OTP code', async () => {
      (twilioService.verifyCode as jest.Mock).mockResolvedValue({
        success: false,
        status: 'pending',
        message: 'Invalid verification code',
      });

      const response = await request(app)
        .post('/api/verify-otp')
        .send({ phone: validPhone, code: '000000' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('OTP_VERIFICATION_FAILED');
    });

    it('should validate code format', async () => {
      const response = await request(app)
        .post('/api/verify-otp')
        .send({ phone: validPhone, code: '12345' }) // Only 5 digits
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate code contains only digits', async () => {
      const response = await request(app)
        .post('/api/verify-otp')
        .send({ phone: validPhone, code: '12345a' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/register', () => {
    const validRegistration = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'SecurePassword123',
      phone: '+11234567890',
    };

    it('should register successfully with verified phone', async () => {
      (redisService.isVerified as jest.Mock).mockResolvedValue(true);
      (shopifyService.searchCustomerByPhone as jest.Mock).mockResolvedValue(null);
      (shopifyService.searchCustomerByEmail as jest.Mock).mockResolvedValue(null);
      (shopifyService.registerCustomer as jest.Mock).mockResolvedValue({
        id: 12345,
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+11234567890',
      });
      (redisService.removeVerification as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/register')
        .send(validRegistration)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customerId).toBe(12345);
      expect(redisService.removeVerification).toHaveBeenCalled();
    });

    it('should reject registration without verified phone', async () => {
      (redisService.isVerified as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/register')
        .send(validRegistration)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHONE_NOT_VERIFIED');
    });

    it('should reject duplicate phone number', async () => {
      (redisService.isVerified as jest.Mock).mockResolvedValue(true);
      (shopifyService.searchCustomerByPhone as jest.Mock).mockResolvedValue({
        id: 999,
        email: 'other@example.com',
      });

      const response = await request(app)
        .post('/api/register')
        .send(validRegistration)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHONE_EXISTS');
    });

    it('should reject duplicate email', async () => {
      (redisService.isVerified as jest.Mock).mockResolvedValue(true);
      (shopifyService.searchCustomerByPhone as jest.Mock).mockResolvedValue(null);
      (shopifyService.searchCustomerByEmail as jest.Mock).mockResolvedValue({
        id: 999,
        email: 'john.doe@example.com',
      });

      const response = await request(app)
        .post('/api/register')
        .send(validRegistration)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ ...validRegistration, email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ ...validRegistration, password: 'weak' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require first name', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ ...validRegistration, firstName: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require last name', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ ...validRegistration, lastName: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is healthy');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
