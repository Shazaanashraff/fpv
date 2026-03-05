# 📜 Complete Code Reference - FPV Phone Verification System

This document provides references to all source code files in the FPV project with descriptions and links.

---

## Table of Contents

1. [GitHub Repository](#github-repository)
2. [Backend API Files](#backend-api-files)
3. [Frontend Shopify Files](#frontend-shopify-files)
4. [Configuration Files](#configuration-files)
5. [Utility Files](#utility-files)
6. [External Resources](#external-resources)

---

## GitHub Repository

🔗 **Main Repository:** https://github.com/Shazaanashraff/fpv

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |

---

## Backend API Files

All backend API files are located in the `/api` folder and are deployed as Vercel serverless functions.

🔗 **API Folder:** https://github.com/Shazaanashraff/fpv/tree/main/api

### 1. send-otp.js

| Property | Value |
|----------|-------|
| **File** | `api/send-otp.js` |
| **Endpoint** | `POST /api/send-otp` |
| **Purpose** | Sends OTP verification codes via Twilio SMS |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/api/send-otp.js |

**Request Format:**
```json
{
    "phone": "+971501234567",
    "locale": "en"
}
```

**Response Format:**
```json
{
    "success": true,
    "message": "OTP sent successfully",
    "data": {
        "status": "pending",
        "to": "+971501234567"
    }
}
```

---

### 2. verify-otp.js

| Property | Value |
|----------|-------|
| **File** | `api/verify-otp.js` |
| **Endpoint** | `POST /api/verify-otp` |
| **Purpose** | Verifies OTP codes entered by users |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/api/verify-otp.js |

**Request Format:**
```json
{
    "phone": "+971501234567",
    "otp": "123456"
}
```

**Response Format:**
```json
{
    "success": true,
    "message": "Phone number verified successfully",
    "data": {
        "status": "approved",
        "to": "+971501234567",
        "valid": true
    }
}
```

---

### 3. debug.js

| Property | Value |
|----------|-------|
| **File** | `api/debug.js` |
| **Endpoint** | `GET /api/debug` |
| **Purpose** | Debug endpoint to check environment configuration |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/api/debug.js |

**Response:** Returns environment status and Twilio configuration details.

---

## Frontend Shopify Files

All Shopify Liquid template files are located in the `/shopify` folder.

🔗 **Shopify Folder:** https://github.com/Shazaanashraff/fpv/tree/main/shopify

### 1. currentform.liquid

| Property | Value |
|----------|-------|
| **File** | `shopify/currentform.liquid` |
| **Purpose** | Main customer registration form with phone OTP verification |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/shopify/currentform.liquid |

**Features:**
- International phone input with country code picker (intl-tel-input)
- 6-digit OTP input with auto-advance
- Form validation
- Password visibility toggle
- Shopify form integration
- Verification status badge

**Installation:**
1. Go to Shopify Admin → Online Store → Themes → Edit Code
2. Create new section or edit existing registration section
3. Paste the content from the file
4. Save

---

### 2. otp-form.liquid

| Property | Value |
|----------|-------|
| **File** | `shopify/otp-form.liquid` |
| **Purpose** | Simple standalone OTP form for basic phone verification |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/shopify/otp-form.liquid |

**Features:**
- Minimal phone input
- Send OTP button
- Success/error messaging
- Can be included as a snippet

**Usage:**
```liquid
{% render 'otp-form' %}
```

---

## Configuration Files

### 1. package.json

| Property | Value |
|----------|-------|
| **File** | `package.json` |
| **Purpose** | Node.js project configuration and dependencies |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/package.json |

**Key Dependencies:**
- `twilio`: ^4.19.3 - Twilio SDK for OTP
- `dotenv`: ^17.2.4 - Environment variable management (dev)

---

### 2. vercel.json

| Property | Value |
|----------|-------|
| **File** | `vercel.json` |
| **Purpose** | Vercel deployment configuration |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/vercel.json |

**Configuration:**
- Memory: 256 MB per function
- Max Duration: 10 seconds

---

### 3. .env.example

| Property | Value |
|----------|-------|
| **File** | `.env.example` |
| **Purpose** | Template for environment variables |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/.env.example |

**Required Variables:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
ALLOWED_ORIGIN=https://your-store.myshopify.com
```

---

## Utility Files

### 1. test-local.js

| Property | Value |
|----------|-------|
| **File** | `test-local.js` |
| **Purpose** | Local testing script for API endpoints |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/test-local.js |

**Usage:**
```bash
node test-local.js
```

---

### 2. phone-diagnostic.js

| Property | Value |
|----------|-------|
| **File** | `phone-diagnostic.js` |
| **Purpose** | Browser console diagnostic tool for debugging phone field issues |
| **GitHub Link** | https://github.com/Shazaanashraff/fpv/blob/main/phone-diagnostic.js |

**Usage:**
1. Open browser console (F12)
2. Copy and paste the script contents
3. Press Enter to run diagnostics

---

## External Resources

### Live Deployment

| Resource | URL |
|----------|-----|
| **API Base URL** | https://fpv-lovat.vercel.app/api |
| **Shopify Store** | https://hxnxj0-zq.myshopify.com |

### Documentation Links

| Resource | URL |
|----------|-----|
| **Twilio Verify API** | https://www.twilio.com/docs/verify/api |
| **Vercel Serverless Functions** | https://vercel.com/docs/functions |
| **intl-tel-input Library** | https://intl-tel-input.com/ |
| **Shopify Liquid Reference** | https://shopify.dev/docs/api/liquid |

### CDN Resources Used

| Library | CDN URL |
|---------|---------|
| **intl-tel-input CSS** | https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/css/intlTelInput.css |
| **intl-tel-input JS** | https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/intlTelInput.min.js |
| **intl-tel-input Utils** | https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js |

---

## File Summary

| File | Type | Location | Description |
|------|------|----------|-------------|
| `send-otp.js` | API | `/api` | Send OTP endpoint |
| `verify-otp.js` | API | `/api` | Verify OTP endpoint |
| `debug.js` | API | `/api` | Debug endpoint |
| `currentform.liquid` | Frontend | `/shopify` | Main registration form |
| `otp-form.liquid` | Frontend | `/shopify` | Simple OTP form |
| `package.json` | Config | `/` | Node.js dependencies |
| `vercel.json` | Config | `/` | Vercel settings |
| `.env.example` | Config | `/` | Environment template |
| `test-local.js` | Utility | `/` | Local test script |
| `phone-diagnostic.js` | Utility | `/` | Browser diagnostic |

---

## Quick Access Links

| Document | Link |
|----------|------|
| 📖 Project Overview | [1-PROJECT-OVERVIEW.md](./1-PROJECT-OVERVIEW.md) |
| 🛠️ Developer Guide | [2-DEVELOPER-GUIDE.md](./2-DEVELOPER-GUIDE.md) |
| 📜 Code Reference | [3-COMPLETE-CODE-REFERENCE.md](./3-COMPLETE-CODE-REFERENCE.md) (this file) |
| 🧪 Test Documentation | [4-TEST-DOCUMENTATION.md](./4-TEST-DOCUMENTATION.md) |

---

*Last Updated: February 12, 2026*
