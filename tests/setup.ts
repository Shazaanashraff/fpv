import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_VERIFY_SERVICE_SID = 'test_verify_service_sid';
process.env.SHOPIFY_STORE_URL = 'test-store.myshopify.com';
process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN = 'test_access_token';
process.env.SHOPIFY_API_VERSION = '2024-01';

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    verify: {
      v2: {
        services: jest.fn().mockReturnValue({
          verifications: {
            create: jest.fn().mockResolvedValue({
              status: 'pending',
              sid: 'test_verification_sid',
            }),
          },
          verificationChecks: {
            create: jest.fn().mockResolvedValue({
              status: 'approved',
              sid: 'test_verification_check_sid',
            }),
          },
        }),
      },
    },
  }));
});

// Mock Axios for Shopify
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

// Global test timeout
jest.setTimeout(10000);

// Cleanup after all tests
afterAll(async () => {
  // Add any cleanup logic here
});
