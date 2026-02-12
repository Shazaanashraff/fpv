module.exports = async (req, res) => {
    try {
        // Helper function to show hidden characters
        const showHidden = (str) => {
            if (!str) return null;
            return {
                raw: str,
                length: str.length,
                charCodes: Array.from(str).map(c => c.charCodeAt(0)),
                hex: Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '),
                escaped: JSON.stringify(str),
            };
        };

        // Test 1: Basic response
        const info = {
            nodeVersion: process.version,
            platform: process.platform,
            env: {
                hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
                hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
                hasVerifySid: !!process.env.TWILIO_VERIFY_SERVICE_SID,
                hasAllowedOrigin: !!process.env.ALLOWED_ORIGIN,
                
                // Show actual values with hidden characters
                twilioSid: showHidden(process.env.TWILIO_ACCOUNT_SID),
                twilioToken: showHidden(process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.substring(0, 10) + '...' : null),
                verifySid: showHidden(process.env.TWILIO_VERIFY_SERVICE_SID),
                allowedOrigin: showHidden(process.env.ALLOWED_ORIGIN),
            },
        };

        // Test 2: Try loading twilio
        try {
            const twilio = require('twilio');
            info.twilioLoaded = true;
            info.twilioVersion = require('twilio/package.json').version;
        } catch (e) {
            info.twilioLoaded = false;
            info.twilioError = e.message;
        }

        return res.status(200).json(info);
    } catch (e) {
        return res.status(500).json({ error: e.message, stack: e.stack });
    }
};
