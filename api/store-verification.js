/**
 * Store Verification API - Updates Shopify customer with verified phone number
 * 
 * POST /api/store-verification
 * Request body: { customerId: "123", phone: "+971501234567" }
 * 
 * This endpoint is called after successful OTP verification to store the
 * verified phone number to the customer's Shopify account.
 */

module.exports = async (req, res) => {
    // Set CORS headers
    let allowedOrigin = (process.env.ALLOWED_ORIGIN || '*')
        .replace(/[\r\n\t\s]+/g, '')
        .replace(/^["']+|["']+$/g, '');
    if (!allowedOrigin) allowedOrigin = '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.',
        });
    }

    // Validate request body
    const { customerId, phone } = req.body || {};

    if (!customerId || typeof customerId !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid "customerId" field.',
        });
    }

    if (!phone || typeof phone !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid "phone" field. Provide a phone number in E.164 format.',
        });
    }

    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(phone)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid phone number format. Use E.164 format, e.g. "+971501234567".',
        });
    }

    // Read Shopify credentials from environment variables
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
    const shopifyToken = process.env.SHOPIFY_ADMIN_API_TOKEN?.trim();

    if (!shopifyDomain || !shopifyToken) {
        console.error('Missing Shopify environment variables: SHOPIFY_STORE_DOMAIN and/or SHOPIFY_ADMIN_API_TOKEN');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error. Shopify credentials are not set.',
        });
    }

    try {
        // Update customer phone number using Shopify Admin REST API
        const updateUrl = `https://${shopifyDomain}/admin/api/2024-01/customers/${customerId}.json`;

        const response = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': shopifyToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer: {
                    id: customerId,
                    phone: phone,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Shopify API error:', response.status, errorText);
            
            // Handle specific error cases
            if (response.status === 404) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found.',
                });
            }
            
            if (response.status === 422) {
                // Parse error message if available
                try {
                    const errorData = JSON.parse(errorText);
                    const errorMsg = errorData.errors?.phone?.[0] || 'Phone number already in use or invalid.';
                    return res.status(422).json({
                        success: false,
                        error: errorMsg,
                    });
                } catch (e) {
                    return res.status(422).json({
                        success: false,
                        error: 'Phone number already in use or invalid.',
                    });
                }
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to update customer phone number. Please try again.',
            });
        }

        const data = await response.json();
        const updatedCustomer = data.customer;

        // Log success
        console.log(`✓ Customer ${customerId} phone updated to ${phone}`);

        return res.status(200).json({
            success: true,
            message: 'Phone number stored successfully',
            data: {
                customerId: updatedCustomer.id,
                phone: updatedCustomer.phone,
                email: updatedCustomer.email,
            },
        });

    } catch (error) {
        console.error('Error updating customer:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again.',
        });
    }
};
