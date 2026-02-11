import https from 'https';
import { logger } from '../utils/logger';
import { config } from '../config/env';

/**
 * Shopify Token Service
 * Manages OAuth client credentials token with automatic refresh
 */

interface TokenResponse {
  access_token: string;
  scope: string;
  expires_in: number;
}

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

// Configuration from environment
const getConfig = () => ({
  shop: config.shopify.storeUrl?.replace('.myshopify.com', '') || '',
  clientId: config.shopify.clientId || '',
  clientSecret: config.shopify.clientSecret || '',
});

/**
 * Fetches a new access token from Shopify using client credentials
 */
async function fetchNewToken(): Promise<TokenResponse> {
  const { shop, clientId, clientSecret } = getConfig();

  if (!shop || !clientId || !clientSecret) {
    throw new Error('Missing Shopify OAuth credentials (SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET)');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${shop}.myshopify.com`,
      port: 443,
      path: '/admin/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data) as TokenResponse;
            logger.info('Successfully fetched new Shopify access token', {
              scope: parsed.scope,
              expiresIn: parsed.expires_in,
            });
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse token response: ${data}`));
          }
        } else {
          reject(new Error(`Shopify token request failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Shopify token request error: ${err.message}`));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Gets a cached token or fetches a new one if expired
 * Refreshes 60 seconds before actual expiry for safety
 */
export async function getShopifyAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    logger.debug('Using cached Shopify access token');
    return cachedToken;
  }

  // Fetch new token
  logger.info('Fetching new Shopify access token...');
  const { access_token, expires_in } = await fetchNewToken();

  // Cache with 60 second buffer before expiry
  cachedToken = access_token;
  tokenExpiry = now + (expires_in - 60) * 1000;

  logger.info('Shopify access token cached', {
    expiresAt: new Date(tokenExpiry).toISOString(),
  });

  return cachedToken;
}

/**
 * Clears the cached token (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = null;
  logger.info('Shopify token cache cleared');
}

/**
 * Check if using OAuth token refresh or static token
 */
export function isUsingOAuthRefresh(): boolean {
  const { clientId, clientSecret } = getConfig();
  return !!(clientId && clientSecret);
}

/**
 * Gets token info for debugging
 */
export function getTokenInfo(): { hasToken: boolean; expiresAt: string | null; isExpired: boolean } {
  const now = Date.now();
  return {
    hasToken: !!cachedToken,
    expiresAt: tokenExpiry ? new Date(tokenExpiry).toISOString() : null,
    isExpired: tokenExpiry ? now >= tokenExpiry : true,
  };
}
