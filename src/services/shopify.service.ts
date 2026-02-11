import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { getShopifyAccessToken, isUsingOAuthRefresh } from './shopify-token.service';

interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

interface CustomerCreateData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

interface CreateCustomerResponse {
  customer: ShopifyCustomer;
}

interface SearchCustomerResponse {
  customers: ShopifyCustomer[];
}

class ShopifyService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://${config.shopify.storeUrl}/admin/api/${config.shopify.apiVersion}`;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add request interceptor to inject fresh token
    this.client.interceptors.request.use(
      async (requestConfig) => {
        const token = await this.getToken();
        requestConfig.headers['X-Shopify-Access-Token'] = token;
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        logger.error(`Shopify API error: ${error.message}`);
        if (error.response) {
          logger.error(`Response status: ${error.response.status}`);
          logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
      }
    );
  }

  /**
   * Gets the appropriate token - either from OAuth refresh or static config
   */
  private async getToken(): Promise<string> {
    if (isUsingOAuthRefresh()) {
      // Use dynamic OAuth token with auto-refresh
      return await getShopifyAccessToken();
    }
    // Fall back to static token from config
    return config.shopify.accessToken;
  }

  /**
   * Search for customer by phone number
   */
  async searchCustomerByPhone(phone: string): Promise<ShopifyCustomer | null> {
    try {
      logger.info(`Searching Shopify customer by phone: ${phone.substring(0, 6)}****`);

      // Shopify search query for phone
      const response = await this.client.get<SearchCustomerResponse>('/customers/search.json', {
        params: {
          query: `phone:${phone}`,
        },
      });

      const customers = response.data.customers;

      if (customers && customers.length > 0) {
        logger.info(`Found ${customers.length} customer(s) with phone`);
        return customers[0];
      }

      logger.info('No customer found with this phone');
      return null;
    } catch (error: any) {
      logger.error(`Shopify search customer error: ${error.message}`);
      throw new Error('Failed to search customer in Shopify');
    }
  }

  /**
   * Search for customer by email
   */
  async searchCustomerByEmail(email: string): Promise<ShopifyCustomer | null> {
    try {
      logger.info(`Searching Shopify customer by email: ${email}`);

      const response = await this.client.get<SearchCustomerResponse>('/customers/search.json', {
        params: {
          query: `email:${email}`,
        },
      });

      const customers = response.data.customers;

      if (customers && customers.length > 0) {
        logger.info('Found customer with email');
        return customers[0];
      }

      logger.info('No customer found with this email');
      return null;
    } catch (error: any) {
      logger.error(`Shopify search customer by email error: ${error.message}`);
      throw new Error('Failed to search customer in Shopify');
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CustomerCreateData): Promise<ShopifyCustomer> {
    try {
      logger.info(`Creating Shopify customer: ${data.email}`);

      const response = await this.client.post<CreateCustomerResponse>('/customers.json', {
        customer: {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          password: data.password,
          password_confirmation: data.password,
          tags: 'phone_verified',
          verified_email: false,
          send_email_welcome: true,
        },
      });

      logger.info(`Customer created successfully with ID: ${response.data.customer.id}`);
      return response.data.customer;
    } catch (error: any) {
      logger.error(`Shopify create customer error: ${error.message}`);
      
      if (error.response?.status === 422) {
        const errors = error.response.data?.errors;
        if (errors?.email) {
          throw new Error('Email is already taken');
        }
        if (errors?.phone) {
          throw new Error('Phone number is already taken');
        }
        throw new Error(`Validation error: ${JSON.stringify(errors)}`);
      }
      
      throw new Error('Failed to create customer in Shopify');
    }
  }

  /**
   * Add metafields to customer
   */
  async addCustomerMetafields(customerId: number, metafields: ShopifyMetafield[]): Promise<void> {
    try {
      logger.info(`Adding metafields to customer ${customerId}`);

      // Shopify expects metafields to be added via the customer update endpoint
      // or via the metafields endpoint
      for (const metafield of metafields) {
        await this.client.post(`/customers/${customerId}/metafields.json`, {
          metafield: {
            namespace: metafield.namespace,
            key: metafield.key,
            value: metafield.value,
            type: metafield.type,
          },
        });
      }

      logger.info(`Metafields added successfully to customer ${customerId}`);
    } catch (error: any) {
      logger.error(`Shopify add metafields error: ${error.message}`);
      // Don't throw - metafields are not critical
      // Customer is already created at this point
    }
  }

  /**
   * Update customer tags
   */
  async updateCustomerTags(customerId: number, tags: string): Promise<void> {
    try {
      logger.info(`Updating tags for customer ${customerId}`);

      await this.client.put(`/customers/${customerId}.json`, {
        customer: {
          id: customerId,
          tags: tags,
        },
      });

      logger.info(`Tags updated successfully for customer ${customerId}`);
    } catch (error: any) {
      logger.error(`Shopify update tags error: ${error.message}`);
      // Don't throw - tags are not critical
    }
  }

  /**
   * Full customer registration flow with metafields
   */
  async registerCustomer(data: CustomerCreateData): Promise<ShopifyCustomer> {
    // Create customer
    const customer = await this.createCustomer(data);

    // Add phone verification metafields
    const metafields: ShopifyMetafield[] = [
      {
        namespace: 'custom',
        key: 'phone_e164',
        value: data.phone,
        type: 'single_line_text_field',
      },
      {
        namespace: 'custom',
        key: 'phone_verified',
        value: 'true',
        type: 'boolean',
      },
      {
        namespace: 'custom',
        key: 'phone_verified_at',
        value: new Date().toISOString(),
        type: 'date_time',
      },
    ];

    await this.addCustomerMetafields(customer.id, metafields);

    return customer;
  }
}

export const shopifyService = new ShopifyService();
