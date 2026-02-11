# Shopify Custom Registration Backend with Twilio OTP

A production-ready Node.js backend for a custom Shopify signup system with phone verification using Twilio Verify API.

## Features

- **Phone OTP Verification**: Secure phone verification using Twilio Verify API
- **Shopify Integration**: Customer creation via Shopify Admin REST API with metafields
- **Redis Session Management**: Cooldown and verification state management
- **Rate Limiting**: Protects against abuse with configurable rate limits
- **Input Validation**: Zod-based request validation
- **TypeScript**: Full type safety throughout the codebase
- **Comprehensive Tests**: Jest + Supertest with mocked external services

## System Flow

1. **Send OTP** (`POST /api/send-otp`)
   - Validates phone number format
   - Converts to E.164 format
   - Checks for duplicate phone in Shopify
   - Sends OTP via Twilio Verify
   - Sets 60-second resend cooldown

2. **Verify OTP** (`POST /api/verify-otp`)
   - Validates OTP code
   - Verifies via Twilio Verify API
   - Marks phone as verified in Redis (10-minute TTL)

3. **Register** (`POST /api/register`)
   - Validates all fields
   - Confirms phone is verified
   - Checks for duplicate phone/email
   - Creates Shopify customer with metafields
   - Adds `phone_verified` tag

## Prerequisites

- Node.js 18+ 
- Redis server
- Twilio account with Verify service
- Shopify store with Admin API access

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd shopify-registration-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid

# Shopify Configuration
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ADMIN_API_ACCESS_TOKEN=your_shopify_admin_api_access_token
SHOPIFY_API_VERSION=2024-01

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# OTP Configuration
OTP_COOLDOWN_SECONDS=60
OTP_VERIFICATION_TTL_SECONDS=600
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Health Check
```http
GET /health
```

### Send OTP
```http
POST /api/send-otp
Content-Type: application/json

{
  "phone": "+11234567890"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {
    "phone": "+1******7890",
    "cooldownSeconds": 60
  }
}
```

### Verify OTP
```http
POST /api/verify-otp
Content-Type: application/json

{
  "phone": "+11234567890",
  "code": "123456"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "data": {
    "phone": "+1******7890",
    "verified": true,
    "expiresInSeconds": 600
  }
}
```

### Register
```http
POST /api/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "phone": "+11234567890"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "customerId": 12345678,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1******7890"
  }
}
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `OTP_SEND_FAILED` | 400 | Failed to send OTP |
| `OTP_VERIFICATION_FAILED` | 400 | Invalid or expired code |
| `OTP_COOLDOWN` | 429 | Must wait before resending |
| `PHONE_NOT_VERIFIED` | 403 | Phone not verified |
| `PHONE_EXISTS` | 409 | Phone already registered |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `NOT_FOUND` | 404 | Route not found |
| `INTERNAL_ERROR` | 500 | Server error |

## Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server startup and graceful shutdown
├── config/
│   └── env.ts             # Environment variables validation
├── controllers/
│   └── auth.controller.ts # Request handlers
├── middleware/
│   ├── errorHandler.ts    # Global error handling
│   ├── logger.ts          # Request logging
│   └── rateLimit.ts       # Rate limiting middleware
├── routes/
│   └── auth.routes.ts     # API routes
├── services/
│   ├── redis.service.ts   # Redis operations
│   ├── shopify.service.ts # Shopify API integration
│   └── twilio.service.ts  # Twilio Verify API
├── utils/
│   ├── logger.ts          # Winston logger
│   └── phone.ts           # Phone number utilities
└── validators/
    └── auth.validator.ts  # Zod validation schemas

tests/
├── setup.ts               # Test configuration
├── auth.test.ts           # Auth endpoints tests
├── shopify.test.ts        # Shopify service tests
├── twilio.test.ts         # Twilio service tests
├── redis.test.ts          # Redis service tests
└── phone.test.ts          # Phone utilities tests
```

## Shopify Setup

### Required Scopes
Your Shopify Admin API access token needs these scopes:
- `read_customers`
- `write_customers`

### Metafields
The application creates these customer metafields:
- `custom.phone_e164` - Phone in E.164 format
- `custom.phone_verified` - Boolean verification status
- `custom.phone_verified_at` - ISO timestamp of verification

## Twilio Setup

1. Create a Twilio account at https://twilio.com
2. Create a Verify Service in the Twilio Console
3. Copy your Account SID, Auth Token, and Verify Service SID

## Security Considerations

- All secrets are stored in environment variables
- Rate limiting prevents brute force attacks
- Input validation on all endpoints
- Passwords require uppercase, lowercase, and numbers
- Phone numbers are masked in responses
- Helmet middleware for security headers

## License

MIT
