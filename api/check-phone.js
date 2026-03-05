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
    const { phone } = req.body || {};

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
            error: 'Invalid phone number format. Use E.164 format, e.g. "+94771234567".',
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
        // Search Shopify customers by phone number using the Admin REST API
        const searchUrl = `https://${shopifyDomain}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(phone)}&fields=id,phone`;

        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': shopifyToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Shopify API error:', response.status, errorText);
            return res.status(500).json({
                success: false,
                error: 'Failed to check phone number. Please try again.',
            });
        }

        const data = await response.json();
        const customers = data.customers || [];

        // Check if any customer has this exact phone number
        // Shopify search is fuzzy, so we verify the exact match
        const exactMatch = customers.some(customer => {
            if (!customer.phone) return false;
            // Normalize both numbers for comparison (remove spaces, dashes)
            const normalizedCustomerPhone = customer.phone.replace(/[\s\-()]/g, '');
            const normalizedSearchPhone = phone.replace(/[\s\-()]/g, '');
            return normalizedCustomerPhone === normalizedSearchPhone;
        });

        return res.status(200).json({
            success: true,
            exists: exactMatch,
            message: exactMatch
                ? 'This phone number is already registered with an account.'
                : 'Phone number is available.',
        });
    } catch (error) {
        console.error('Error checking phone number:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check phone number. Please try again.',
        });
    }
};
