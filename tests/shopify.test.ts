// Mock axios before importing the service
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
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

// Mock the token service
jest.mock('../src/services/shopify-token.service', () => ({
  getShopifyAccessToken: jest.fn().mockResolvedValue('test_token'),
  isUsingOAuthRefresh: jest.fn().mockReturnValue(false),
}));

import { shopifyService } from '../src/services/shopify.service';

describe('Shopify Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCustomerByPhone', () => {
    it('should return customer when found', async () => {
      const mockCustomer = {
        id: 123,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+11234567890',
      };

      mockGet.mockResolvedValue({
        data: { customers: [mockCustomer] },
      });

      const result = await shopifyService.searchCustomerByPhone('+11234567890');

      expect(result).toEqual(mockCustomer);
      expect(mockGet).toHaveBeenCalledWith('/customers/search.json', {
        params: { query: 'phone:+11234567890' },
      });
    });

    it('should return null when no customer found', async () => {
      mockGet.mockResolvedValue({
        data: { customers: [] },
      });

      const result = await shopifyService.searchCustomerByPhone('+11234567890');

      expect(result).toBeNull();
    });

    it('should throw error on API failure', async () => {
      mockGet.mockRejectedValue(new Error('API Error'));

      await expect(
        shopifyService.searchCustomerByPhone('+11234567890')
      ).rejects.toThrow('Failed to search customer in Shopify');
    });
  });

  describe('searchCustomerByEmail', () => {
    it('should return customer when found', async () => {
      const mockCustomer = {
        id: 123,
        email: 'test@example.com',
      };

      mockGet.mockResolvedValue({
        data: { customers: [mockCustomer] },
      });

      const result = await shopifyService.searchCustomerByEmail('test@example.com');

      expect(result).toEqual(mockCustomer);
    });

    it('should return null when no customer found', async () => {
      mockGet.mockResolvedValue({
        data: { customers: [] },
      });

      const result = await shopifyService.searchCustomerByEmail('test@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createCustomer', () => {
    it('should create customer successfully', async () => {
      const mockCustomer = {
        id: 456,
        email: 'new@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
      };

      mockPost.mockResolvedValue({
        data: { customer: mockCustomer },
      });

      const result = await shopifyService.createCustomer({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'new@example.com',
        password: 'SecurePass123',
        phone: '+11234567890',
      });

      expect(result).toEqual(mockCustomer);
      expect(mockPost).toHaveBeenCalledWith('/customers.json', {
        customer: expect.objectContaining({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'new@example.com',
          phone: '+11234567890',
          tags: 'phone_verified',
        }),
      });
    });

    it('should throw error for duplicate email', async () => {
      mockPost.mockRejectedValue({
        response: {
          status: 422,
          data: { errors: { email: ['has already been taken'] } },
        },
      });

      await expect(
        shopifyService.createCustomer({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'existing@example.com',
          password: 'SecurePass123',
          phone: '+11234567890',
        })
      ).rejects.toThrow('Email is already taken');
    });

    it('should throw error for duplicate phone', async () => {
      mockPost.mockRejectedValue({
        response: {
          status: 422,
          data: { errors: { phone: ['has already been taken'] } },
        },
      });

      await expect(
        shopifyService.createCustomer({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'new@example.com',
          password: 'SecurePass123',
          phone: '+11234567890',
        })
      ).rejects.toThrow('Phone number is already taken');
    });
  });

  describe('addCustomerMetafields', () => {
    it('should add metafields successfully', async () => {
      mockPost.mockResolvedValue({ data: {} });

      await shopifyService.addCustomerMetafields(123, [
        {
          namespace: 'custom',
          key: 'phone_e164',
          value: '+11234567890',
          type: 'single_line_text_field',
        },
      ]);

      expect(mockPost).toHaveBeenCalledWith(
        '/customers/123/metafields.json',
        expect.objectContaining({
          metafield: expect.objectContaining({
            namespace: 'custom',
            key: 'phone_e164',
          }),
        })
      );
    });

    it('should not throw on metafield error', async () => {
      mockPost.mockRejectedValue(new Error('API Error'));

      // Should not throw
      await expect(
        shopifyService.addCustomerMetafields(123, [
          {
            namespace: 'custom',
            key: 'phone_e164',
            value: '+11234567890',
            type: 'single_line_text_field',
          },
        ])
      ).resolves.not.toThrow();
    });
  });

  describe('registerCustomer', () => {
    it('should register customer with metafields', async () => {
      const mockCustomer = {
        id: 789,
        email: 'register@example.com',
        first_name: 'Test',
        last_name: 'User',
      };

      mockPost.mockResolvedValue({
        data: { customer: mockCustomer },
      });

      const result = await shopifyService.registerCustomer({
        firstName: 'Test',
        lastName: 'User',
        email: 'register@example.com',
        password: 'SecurePass123',
        phone: '+11234567890',
      });

      expect(result).toEqual(mockCustomer);
      // Verify metafields were added (3 metafield calls)
      expect(mockPost).toHaveBeenCalledTimes(4); // 1 customer + 3 metafields
    });
  });
});
