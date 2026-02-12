const twilio = require('twilio');

module.exports = async (req, res) => {
    try {
        // Set CORS headers — use ALLOWED_ORIGIN env var to restrict in production
        let allowedOrigin = (process.env.ALLOWED_ORIGIN || '*')
            .replace(/[\r\n\t\s]+/g, '') // Remove all whitespace chars
            .replace(/^["']+|["']+$/g, ''); // Remove quotes
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
        const { phone, locale } = req.body || {};

        if (!phone || typeof phone !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid "phone" field. Provide a phone number in E.164 format, e.g. "+94XXXXXXXXX".',
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

        // Read Twilio credentials from environment variables
        const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
        const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
        const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

        if (!accountSid || !authToken || !verifyServiceSid) {
            console.error('Missing Twilio environment variables');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error. Twilio credentials are not set.',
            });
        }

        const client = twilio(accountSid, authToken);

        // Prepare verification parameters
        const verificationParams = {
            to: phone,
            channel: 'sms',
        };
        
        // Add locale if provided (default will be 'en' for English)
        if (locale && typeof locale === 'string') {
            verificationParams.locale = locale;
        }

        const verification = await client.verify.v2
            .services(verifyServiceSid)
            .verifications.create(verificationParams);

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                status: verification.status,
                to: phone,
            },
        });
    } catch (error) {
        console.error('send-otp error:', error);

        // Handle specific Twilio error codes
        if (error.code === 60200) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number.',
            });
        }

        if (error.code === 60203) {
            return res.status(429).json({
                success: false,
                error: 'Max verification attempts reached. Please try again later.',
            });
        }

        if (error.code === 60605) {
            return res.status(400).json({
                success: false,
                error: 'Phone number country not supported. Please use a different phone number.',
            });
        }

        if (error.code === 60082) {
            return res.status(400).json({
                success: false,
                error: 'Landline or unreachable phone number. Please use a mobile phone.',
            });
        }

        if (error.code === 21211) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format.',
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to send OTP. Please try again later.',
            errorCode: error.code,
            errorDetails: error.toString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
};
