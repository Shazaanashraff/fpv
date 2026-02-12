const twilio = require('twilio');

module.exports = async (req, res) => {
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
    const { phone, otp } = req.body || {};

    if (!phone || typeof phone !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid "phone" field. Provide a phone number in E.164 format.',
        });
    }

    if (!otp || typeof otp !== 'string' || otp.length !== 6) {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid "otp" field. Provide a 6-digit OTP code.',
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

    try {
        const client = twilio(accountSid, authToken);

        const verificationCheck = await client.verify.v2
            .services(verifyServiceSid)
            .verificationChecks.create({
                to: phone,
                code: otp,
            });

        if (verificationCheck.status === 'approved') {
            return res.status(200).json({
                success: true,
                message: 'Phone number verified successfully',
                data: {
                    status: verificationCheck.status,
                    to: phone,
                    valid: true,
                },
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid OTP code. Please try again.',
                data: {
                    status: verificationCheck.status,
                    valid: false,
                },
            });
        }
    } catch (error) {
        console.error('Twilio API error:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error);

        if (error.code === 20404) {
            return res.status(400).json({
                success: false,
                error: 'Verification expired or not found. Please request a new OTP.',
            });
        }

        if (error.code === 60202) {
            return res.status(429).json({
                success: false,
                error: 'Max check attempts reached. Please request a new OTP.',
            });
        }

        if (error.code === 60200) {
            return res.status(400).json({
                success: false,
                error: 'Invalid verification code.',
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to verify OTP. Please try again later.',
            errorCode: error.code,
            errorDetails: error.toString(),
        });
    }
};
