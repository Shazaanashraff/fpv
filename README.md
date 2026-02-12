# Vercel OTP API — Twilio Verify

A minimal Node.js backend deployed on **Vercel** as a serverless function. Provides a single API endpoint to send OTP verification codes via **Twilio Verify SMS**.

## Features

- ✅ Vercel serverless — no Express, no `app.listen()`
- ✅ Single `POST /api/send-otp` endpoint
- ✅ Twilio Verify API for SMS OTP delivery
- ✅ E.164 phone number validation
- ✅ CORS headers included
- ✅ Proper JSON error responses

## Folder Structure

```
fpv/
├── api/
│   └── send-otp.js      # Serverless function
├── .env.example          # Environment variable template
├── .gitignore
├── package.json
├── vercel.json           # Vercel configuration
└── README.md
```

---

## Step-by-Step Setup

### 1. Initialize the Project

```bash
# If starting fresh (already done in this repo):
mkdir fpv && cd fpv
npm init -y
```

### 2. Install Dependencies

```bash
npm install twilio
```

### 3. Create the Folder Structure

```bash
mkdir api
```

### 4. Add the API Code

Create `api/send-otp.js` — this is the serverless function that Vercel auto-maps to `POST /api/send-otp`.

The function:
- Accepts `POST` requests with JSON body `{ "phone": "+94XXXXXXXXX" }`
- Validates the phone number format (E.164)
- Sends an OTP via Twilio Verify SMS
- Returns JSON success/error responses

### 5. Set Up Environment Variables

Copy the template and fill in your Twilio credentials:

```bash
cp .env.example .env
```

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
```

> **Where to get these:**
> 1. Sign up at [twilio.com](https://www.twilio.com)
> 2. Find your **Account SID** and **Auth Token** on the [Twilio Console](https://console.twilio.com)
> 3. Create a **Verify Service** under Verify → Services → Create, then copy the **Service SID**

### 6. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy (follow the prompts)
vercel
```

#### Option B: Using Git (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository
4. Vercel auto-detects the `api/` folder — no extra config needed
5. Click **Deploy**

### 7. Set Environment Variables in Vercel

1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to **Settings → Environment Variables**
3. Add these three variables:

| Name | Value |
|------|-------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_VERIFY_SERVICE_SID` | Your Twilio Verify Service SID |

4. **Redeploy** the project for the variables to take effect

### 8. Test the API

```bash
curl -X POST https://your-project.vercel.app/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+94771234567"}'
```

---

## API Reference

### `POST /api/send-otp`

Send an OTP verification code via SMS.

**Request Body:**
```json
{
  "phone": "+94771234567"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "status": "pending",
    "to": "+94771234567"
  }
}
```

**Error Responses:**

| Status | Scenario | Example |
|--------|----------|---------|
| `400` | Missing or invalid phone | `{ "success": false, "error": "Missing or invalid \"phone\" field..." }` |
| `400` | Bad phone format | `{ "success": false, "error": "Invalid phone number format..." }` |
| `405` | Wrong HTTP method | `{ "success": false, "error": "Method not allowed. Use POST." }` |
| `429` | Too many attempts | `{ "success": false, "error": "Max verification attempts reached..." }` |
| `500` | Server/Twilio error | `{ "success": false, "error": "Failed to send OTP..." }` |

---

## Local Development

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally (reads .env file automatically)
vercel dev
```

The API will be available at `http://localhost:3000/api/send-otp`.

## License

MIT
