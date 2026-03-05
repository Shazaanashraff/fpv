# 📱 FPV - Phone Verification System

## Project Overview

**FPV (Phone Verification)** is a complete phone number OTP (One-Time Password) verification system designed for Shopify stores. It consists of a **Vercel serverless backend** that integrates with **Twilio Verify API** and a **Shopify Liquid frontend** form for customer registration with phone verification.

---

## 🎯 Purpose

The system enables Shopify stores to:
1. **Verify customer phone numbers** during registration using SMS OTP
2. **Prevent fake accounts** by requiring verified phone numbers
3. **Store verified phone data** in Shopify customer records
4. **Provide a seamless UX** with international phone number support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SHOPIFY STORE                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Customer Registration Form                      │   │
│  │         (shopify/currentform.liquid)                        │   │
│  │                                                              │   │
│  │  ┌─────────────────┐    ┌──────────────────────────────┐   │   │
│  │  │  Phone Input    │    │  OTP Input (6 digits)        │   │   │
│  │  │  +971 5012345   │    │  □ □ □ □ □ □                 │   │   │
│  │  └────────┬────────┘    └──────────────┬───────────────┘   │   │
│  │           │                            │                    │   │
│  └───────────┼────────────────────────────┼────────────────────┘   │
│              │                            │                         │
└──────────────┼────────────────────────────┼─────────────────────────┘
               │                            │
               │ POST /api/send-otp         │ POST /api/verify-otp
               │                            │
               ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS BACKEND                        │
│                    https://fpv-lovat.vercel.app                     │
│  ┌───────────────────────┐    ┌───────────────────────┐            │
│  │    api/send-otp.js    │    │   api/verify-otp.js   │            │
│  │   - Validates phone   │    │   - Validates OTP     │            │
│  │   - Calls Twilio      │    │   - Calls Twilio      │            │
│  │   - Returns status    │    │   - Returns result    │            │
│  └───────────┬───────────┘    └───────────┬───────────┘            │
└──────────────┼────────────────────────────┼─────────────────────────┘
               │                            │
               │ Twilio Verify API          │
               ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         TWILIO VERIFY                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • Generates 6-digit OTP                                     │   │
│  │  • Sends SMS to phone number                                 │   │
│  │  • Stores verification state (10 min expiry)                 │   │
│  │  • Validates OTP attempts                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
fpv/
├── api/                          # Vercel serverless functions
│   ├── send-otp.js              # Sends OTP via Twilio
│   ├── verify-otp.js            # Verifies OTP code
│   └── debug.js                 # Debug endpoint for troubleshooting
│
├── shopify/                      # Shopify Liquid templates
│   ├── currentform.liquid       # Main registration form with OTP
│   └── otp-form.liquid          # Simple standalone OTP form
│
├── docs/                         # Documentation
│   ├── 1-PROJECT-OVERVIEW.md    # This file
│   ├── 2-DEVELOPER-GUIDE.md     # Developer setup & modification guide
│   └── 3-COMPLETE-CODE-REFERENCE.md  # Full code documentation
│
├── coverage/                     # Test coverage reports (auto-generated)
│
├── .env.local                   # Local environment variables
├── .env.example                 # Environment variable template
├── .gitignore                   # Git ignore rules
├── package.json                 # Node.js dependencies
├── vercel.json                  # Vercel configuration
├── test-local.js                # Local testing script
├── phone-diagnostic.js          # Browser diagnostic tool
├── DATA-FLOW-EXPLAINED.md       # Data flow documentation
└── README.md                    # Basic setup instructions
```

---

## 🔄 How It Works

### Complete User Flow

```
1. USER OPENS REGISTRATION PAGE
   │
   ▼
2. USER ENTERS PHONE NUMBER
   │  • intl-tel-input library provides country code picker
   │  • Auto-formats to E.164 format (e.g., +971501234567)
   │
   ▼
3. USER CLICKS "Send OTP"
   │  • Frontend validates phone number
   │  • Calls: POST https://fpv-lovat.vercel.app/api/send-otp
   │  • Body: { "phone": "+971501234567" }
   │
   ▼
4. BACKEND PROCESSES REQUEST
   │  • Validates E.164 format
   │  • Calls Twilio Verify API
   │  • Twilio sends SMS with 6-digit code
   │  • Returns: { "success": true, "status": "pending" }
   │
   ▼
5. USER RECEIVES SMS
   │  • 6-digit code (e.g., "123456")
   │  • Valid for 10 minutes
   │
   ▼
6. USER ENTERS OTP CODE
   │  • 6 individual input boxes
   │  • Auto-focuses next box
   │  • Supports paste functionality
   │
   ▼
7. USER CLICKS "Verify"
   │  • Calls: POST https://fpv-lovat.vercel.app/api/verify-otp
   │  • Body: { "phone": "+971501234567", "otp": "123456" }
   │
   ▼
8. BACKEND VERIFIES OTP
   │  • Calls Twilio Verify Check API
   │  • Returns: { "success": true, "status": "approved" }
   │
   ▼
9. VERIFICATION SUCCESS
   │  • Phone field becomes read-only
   │  • "Phone verified" badge appears
   │  • Submit button becomes enabled
   │
   ▼
10. USER SUBMITS FORM
    │  • Form submits to Shopify
    │  • Phone stored in: customer[phone]
    │  • Backup stored in: customer[note][verified_phone]
    │
    ▼
11. SHOPIFY CREATES CUSTOMER
    • Customer record includes verified phone number
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend Hosting** | Vercel | Serverless function hosting |
| **SMS Service** | Twilio Verify | OTP generation and delivery |
| **Backend Language** | Node.js 20.x | Server-side JavaScript |
| **Frontend** | Shopify Liquid | Templating for Shopify stores |
| **Phone Input** | intl-tel-input | International phone formatting |
| **Package Manager** | npm | Dependency management |

---

## 🔗 GitHub Repository

**Repository:** https://github.com/Shazaanashraff/fpv

**Branch:** `main`

---

## 🌐 Live Deployment

- **API Base URL:** `https://fpv-lovat.vercel.app/api`
- **Shopify Store:** `https://hxnxj0-zq.myshopify.com`

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/send-otp` | POST | Send OTP to phone number |
| `/api/verify-otp` | POST | Verify OTP code |
| `/api/debug` | GET | Debug environment info |

---

## 🔐 Security Features

1. **CORS Protection** - Restricts API access to allowed origins
2. **E.164 Validation** - Ensures valid phone number format
3. **Rate Limiting** - Twilio handles attempt limits
4. **10-minute Expiry** - OTPs expire automatically
5. **Environment Variables** - Sensitive data stored securely
6. **Read-only After Verify** - Prevents phone number changes after verification

---

## 📄 License

MIT License

---

## 👤 Author

**Shazaan Ashraff**

---

*Last Updated: February 2026*
