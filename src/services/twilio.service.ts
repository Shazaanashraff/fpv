import twilio from 'twilio';
import { config } from '../config/env';
import { logger } from '../utils/logger';

interface VerificationResult {
  success: boolean;
  status: string;
  message?: string;
}

class TwilioService {
  private client: twilio.Twilio;
  private verifyServiceSid: string;

  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.verifyServiceSid = config.twilio.verifyServiceSid;
  }

  /**
   * Send OTP verification code to phone number
   */
  async sendVerification(phone: string): Promise<VerificationResult> {
    try {
      logger.info(`Sending OTP to ${phone.substring(0, 6)}****`);
      
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phone,
          channel: 'sms',
        });

      logger.info(`OTP sent successfully, status: ${verification.status}`);

      return {
        success: true,
        status: verification.status,
      };
    } catch (error: any) {
      logger.error(`Twilio send verification error: ${error.message}`);
      
      // Handle specific Twilio errors
      if (error.code === 60200) {
        return {
          success: false,
          status: 'invalid',
          message: 'Invalid phone number',
        };
      }

      if (error.code === 60203) {
        return {
          success: false,
          status: 'max_attempts',
          message: 'Max verification attempts reached',
        };
      }

      return {
        success: false,
        status: 'error',
        message: error.message || 'Failed to send verification code',
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyCode(phone: string, code: string): Promise<VerificationResult> {
    try {
      logger.info(`Verifying OTP for ${phone.substring(0, 6)}****`);

      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phone,
          code: code,
        });

      logger.info(`OTP verification status: ${verificationCheck.status}`);

      if (verificationCheck.status === 'approved') {
        return {
          success: true,
          status: 'approved',
        };
      }

      return {
        success: false,
        status: verificationCheck.status,
        message: 'Invalid verification code',
      };
    } catch (error: any) {
      logger.error(`Twilio verify code error: ${error.message}`);

      if (error.code === 20404) {
        return {
          success: false,
          status: 'not_found',
          message: 'Verification not found or expired',
        };
      }

      if (error.code === 60202) {
        return {
          success: false,
          status: 'max_attempts',
          message: 'Max check attempts reached',
        };
      }

      return {
        success: false,
        status: 'error',
        message: error.message || 'Failed to verify code',
      };
    }
  }
}

export const twilioService = new TwilioService();
