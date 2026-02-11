// Mock Twilio before importing the service
const mockVerificationsCreate = jest.fn();
const mockVerificationChecksCreate = jest.fn();

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    verify: {
      v2: {
        services: jest.fn().mockReturnValue({
          verifications: {
            create: mockVerificationsCreate,
          },
          verificationChecks: {
            create: mockVerificationChecksCreate,
          },
        }),
      },
    },
  }));
});

import { twilioService } from '../src/services/twilio.service';

describe('Twilio Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerification', () => {
    it('should send verification successfully', async () => {
      mockVerificationsCreate.mockResolvedValue({
        status: 'pending',
        sid: 'test_sid',
      });

      const result = await twilioService.sendVerification('+11234567890');

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(mockVerificationsCreate).toHaveBeenCalledWith({
        to: '+11234567890',
        channel: 'sms',
      });
    });

    it('should handle invalid phone number error', async () => {
      const error: any = new Error('Invalid phone');
      error.code = 60200;
      mockVerificationsCreate.mockRejectedValue(error);

      const result = await twilioService.sendVerification('+11234567890');

      expect(result.success).toBe(false);
      expect(result.status).toBe('invalid');
      expect(result.message).toBe('Invalid phone number');
    });

    it('should handle max attempts error', async () => {
      const error: any = new Error('Max attempts');
      error.code = 60203;
      mockVerificationsCreate.mockRejectedValue(error);

      const result = await twilioService.sendVerification('+11234567890');

      expect(result.success).toBe(false);
      expect(result.status).toBe('max_attempts');
    });

    it('should handle generic error', async () => {
      mockVerificationsCreate.mockRejectedValue(new Error('Unknown error'));

      const result = await twilioService.sendVerification('+11234567890');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      mockVerificationChecksCreate.mockResolvedValue({
        status: 'approved',
        sid: 'test_check_sid',
      });

      const result = await twilioService.verifyCode('+11234567890', '123456');

      expect(result.success).toBe(true);
      expect(result.status).toBe('approved');
      expect(mockVerificationChecksCreate).toHaveBeenCalledWith({
        to: '+11234567890',
        code: '123456',
      });
    });

    it('should handle pending status (wrong code)', async () => {
      mockVerificationChecksCreate.mockResolvedValue({
        status: 'pending',
        sid: 'test_check_sid',
      });

      const result = await twilioService.verifyCode('+11234567890', '000000');

      expect(result.success).toBe(false);
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Invalid verification code');
    });

    it('should handle not found error', async () => {
      const error: any = new Error('Not found');
      error.code = 20404;
      mockVerificationChecksCreate.mockRejectedValue(error);

      const result = await twilioService.verifyCode('+11234567890', '123456');

      expect(result.success).toBe(false);
      expect(result.status).toBe('not_found');
      expect(result.message).toBe('Verification not found or expired');
    });

    it('should handle max check attempts error', async () => {
      const error: any = new Error('Max attempts');
      error.code = 60202;
      mockVerificationChecksCreate.mockRejectedValue(error);

      const result = await twilioService.verifyCode('+11234567890', '123456');

      expect(result.success).toBe(false);
      expect(result.status).toBe('max_attempts');
    });

    it('should handle generic error', async () => {
      mockVerificationChecksCreate.mockRejectedValue(new Error('Unknown error'));

      const result = await twilioService.verifyCode('+11234567890', '123456');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
    });
  });
});
