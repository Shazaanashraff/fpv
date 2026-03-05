# 🛠️ Developer Guide - FPV Phone Verification System

This guide is for developers who need to understand, maintain, or modify the FPV phone verification system.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Backend API Development](#backend-api-development)
5. [Frontend Development](#frontend-development)
6. [Common Modifications](#common-modifications)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 20.x | [nodejs.org](https://nodejs.org) |
| npm | 9.x+ | Comes with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com) |
| Vercel CLI | Latest | `npm install -g vercel` |

### Required Accounts

1. **Twilio Account** - [twilio.com](https://www.twilio.com)
   - Account SID
   - Auth Token
   - Verify Service SID

2. **Vercel Account** - [vercel.com](https://vercel.com)
   - For deployment

3. **Shopify Partner/Store Access** - For frontend deployment

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Shazaanashraff/fpv.git
cd fpv
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

```bash
# Copy the example file
cp .env.example .env.local

# Or create manually with these variables:
```

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here

# CORS Configuration
ALLOWED_ORIGIN=https://your-shopify-store.myshopify.com
```

### 4. Run Local Development Server

```bash
npm run dev
# or
vercel dev
```

The API will be available at `http://localhost:3000/api`

### 5. Test Locally

```bash
node test-local.js
```

---

## Environment Configuration

### Twilio Setup

1. **Create a Twilio Account**
   - Go to [twilio.com](https://www.twilio.com)
   - Sign up for a free trial

2. **Get Account Credentials**
   - Dashboard → Account SID (starts with `AC`)
   - Dashboard → Auth Token

3. **Create a Verify Service**
   - Go to Console → Verify → Services
   - Click "Create new Service"
   - Name it (e.g., "FPV Phone Verification")
   - Copy the Service SID (starts with `VA`)

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_VERIFY_SERVICE_SID` | Verify service identifier | `VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `ALLOWED_ORIGIN` | CORS allowed origin | `https://store.myshopify.com` |

---

## Backend API Development

### File Structure

```
api/
├── send-otp.js      # POST /api/send-otp
├── verify-otp.js    # POST /api/verify-otp
└── debug.js         # GET /api/debug
```

### Creating a New Endpoint

1. **Create a new file in `api/` folder**

```javascript
// api/my-endpoint.js
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Your logic here
    return res.status(200).json({ success: true });
};
```

2. **Deploy to Vercel** - Endpoint automatically available at `/api/my-endpoint`

### API Response Format

All endpoints follow this response structure:

```javascript
// Success Response
{
    "success": true,
    "message": "Description of what happened",
    "data": {
        // Additional data
    }
}

// Error Response
{
    "success": false,
    "error": "Error description",
    "errorCode": "OPTIONAL_CODE"
}
```

### Twilio Error Codes

| Code | Meaning | User Message |
|------|---------|--------------|
| 60200 | Invalid phone number | "Invalid phone number." |
| 60203 | Max attempts reached | "Max verification attempts reached." |
| 60605 | Country not supported | "Phone number country not supported." |
| 60082 | Landline number | "Please use a mobile phone." |
| 20404 | Verification expired | "Verification expired. Request new OTP." |
| 60202 | Max check attempts | "Max check attempts. Request new OTP." |

---

## Frontend Development

### Shopify Liquid Files

| File | Purpose | Location in Shopify |
|------|---------|---------------------|
| `currentform.liquid` | Main registration form | Sections/Snippets |
| `otp-form.liquid` | Simple OTP form | Snippets |

### Deploying to Shopify

1. **Access Theme Editor**
   - Shopify Admin → Online Store → Themes → Edit Code

2. **Add/Update Files**
   - For sections: Add to `sections/` folder
   - For snippets: Add to `snippets/` folder

3. **Include in Template**
   ```liquid
   {% section 'currentform' %}
   {# or #}
   {% render 'otp-form' %}
   ```

### Key Frontend Components

#### Phone Input with intl-tel-input

```javascript
const iti = window.intlTelInput(phoneInput, {
    initialCountry: "ae",              // Default country
    preferredCountries: ["ae", "us"],  // Top countries in dropdown
    separateDialCode: true,            // Show dial code separately
    nationalMode: false,               // Use international format
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js",
});

// Get formatted number
const fullNumber = iti.getNumber(); // Returns "+971501234567"
```

#### OTP Input Handler

```javascript
// Handle 6-digit OTP input
otpInputs.forEach((input, index) => {
    input.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, ''); // Numbers only
        if (this.value.length === 1 && index < 5) {
            otpInputs[index + 1].focus(); // Auto-advance
        }
    });
});
```

---

## Common Modifications

### Change Default Country

In `currentform.liquid`, find the intl-tel-input initialization:

```javascript
const iti = window.intlTelInput(phoneInput, {
    initialCountry: "ae",  // Change this (e.g., "us", "lk", "gb")
    preferredCountries: ["ae", "us", "lk", "gb"],  // Modify this list
    // ...
});
```

### Change OTP Resend Timer

```javascript
function startResendTimer() {
    let seconds = 30;  // Change this value (in seconds)
    // ...
}
```

### Modify API URL

In the frontend files, find:

```javascript
const OTP_API_BASE = 'https://fpv-lovat.vercel.app/api';
```

Change to your Vercel deployment URL.

### Add Custom Validation

In `send-otp.js`, add after E.164 validation:

```javascript
// Example: Block specific country codes
const blockedCountries = ['+1', '+44'];
if (blockedCountries.some(code => phone.startsWith(code))) {
    return res.status(400).json({
        success: false,
        error: 'Phone numbers from this country are not supported.'
    });
}
```

### Customize OTP Message (Twilio Dashboard)

1. Go to Twilio Console → Verify → Services
2. Select your service
3. Go to "Messaging" tab
4. Customize the template

### Add Additional Form Fields

In `currentform.liquid`, add new fields inside the form:

```liquid
<div class="field">
    <input
        type="text"
        class="input is-floating"
        name="customer[note][custom_field]"
        id="CustomField"
        placeholder="Your Label"
    />
    <label class="label is-floating" for="CustomField">Your Label</label>
</div>
```

---

## Testing

### Local API Testing

```bash
# Run the test script
node test-local.js
```

### Browser Console Testing

Open browser console on your Shopify store and paste:

```javascript
// Test send-otp endpoint
fetch('https://fpv-lovat.vercel.app/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+971501234567' })
})
.then(r => r.json())
.then(console.log);
```

### Diagnostic Script

Run the phone diagnostic tool in browser console:

```javascript
// Copy contents of phone-diagnostic.js and paste in console
```

### Debug Endpoint

Visit: `https://fpv-lovat.vercel.app/api/debug`

This shows:
- Node.js version
- Environment variable status
- Twilio SDK status

---

## Deployment

### Deploy Backend to Vercel

#### Option 1: CLI Deployment

```bash
# First time setup
vercel

# Subsequent deployments
vercel --prod
```

#### Option 2: Git Deployment (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Auto-deploys on push to main

#### Set Environment Variables in Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_VERIFY_SERVICE_SID`
   - `ALLOWED_ORIGIN`

### Deploy Frontend to Shopify

1. Copy `shopify/currentform.liquid` content
2. In Shopify Admin → Themes → Edit Code
3. Create/edit section file
4. Paste the content
5. Save

---

## Troubleshooting

### Common Issues

#### CORS Errors

**Symptom:** Browser console shows "Access-Control-Allow-Origin" error

**Solution:**
1. Check `ALLOWED_ORIGIN` environment variable in Vercel
2. Must match your Shopify store URL exactly
3. Include `https://` prefix

```env
ALLOWED_ORIGIN=https://your-store.myshopify.com
```

#### OTP Not Sending

**Symptom:** "Failed to send OTP" error

**Checklist:**
1. Verify Twilio credentials in Vercel
2. Check phone number format (must be E.164: `+1234567890`)
3. Ensure Twilio account has SMS credits
4. Check Twilio console for errors

#### Phone Not Saving to Shopify

**Symptom:** Customer created without phone number

**Solution:**
1. Ensure hidden input exists: `<input type="hidden" name="customer[phone]">`
2. Check that value is set before form submit
3. Run `phone-diagnostic.js` in browser console
4. Check browser Network tab for form data

#### "Verification Expired" Error

**Cause:** OTP codes expire after 10 minutes

**Solution:**
1. User should request new OTP
2. Cannot be changed (Twilio limitation)

### Debug Checklist

1. **Check Vercel Logs**
   - Vercel Dashboard → Project → Deployments → View Logs

2. **Check Browser Console**
   - F12 → Console tab
   - Look for error messages

3. **Check Network Tab**
   - F12 → Network tab
   - Inspect API requests/responses

4. **Test Debug Endpoint**
   - Visit `/api/debug` to check environment setup

### Getting Help

1. Check existing documentation in `docs/` folder
2. Review `DATA-FLOW-EXPLAINED.md`
3. Check Twilio documentation: [twilio.com/docs/verify](https://www.twilio.com/docs/verify)
4. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)

---

## Quick Reference

### Useful Commands

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Vercel
vercel --prod

# Run tests
node test-local.js
```

### Important Files

| File | Purpose |
|------|---------|
| `api/send-otp.js` | Send OTP endpoint |
| `api/verify-otp.js` | Verify OTP endpoint |
| `shopify/currentform.liquid` | Main registration form |
| `.env.local` | Local environment variables |
| `vercel.json` | Vercel configuration |

### API Quick Reference

```bash
# Send OTP
POST /api/send-otp
Body: { "phone": "+971501234567" }

# Verify OTP
POST /api/verify-otp
Body: { "phone": "+971501234567", "otp": "123456" }
```

---

*Last Updated: February 2026*
