# Deployment Instructions - Phone Verification Checkout Gate

Complete step-by-step guide to deploy the phone verification system to your Shopify store.

---

## 📋 Overview

This system prevents customers from accessing checkout until they verify their phone number via OTP. Once verified, the phone is stored in their Shopify customer account and they can checkout freely on future purchases.

**Flow:**
```
Customer with no phone → Cart → Click Checkout 
→ Redirect to /pages/phone-verification?return=/checkout 
→ Enter phone → Send OTP → Verify OTP 
→ Store to Shopify customer account 
→ Redirect to checkout
```

---

## 🚀 Step 1: Deploy Backend API to Vercel

The new API endpoint needs to be deployed to your Vercel project.

### A. Push to Git

```bash
# Navigate to your project directory
cd c:\Users\moham\Desktop\FPV

# Add the new API file
git add api/store-verification.js

# Commit the change
git commit -m "Add store-verification API endpoint for phone verification"

# Push to GitHub (triggers Vercel deployment)
git push origin main
```

### B. Verify Deployment

1. Go to https://vercel.com/dashboard
2. Find your project (fpv-lovat)
3. Wait for deployment to complete (~2 minutes)
4. Test the new endpoint:

```bash
# Test endpoint (replace with your customer ID)
curl -X POST https://fpv-lovat.vercel.app/api/store-verification \
  -H "Content-Type: application/json" \
  -d '{"customerId":"123456789","phone":"+971501234567"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Phone number stored successfully",
  "data": {
    "customerId": "123456789",
    "phone": "+971501234567",
    "email": "customer@example.com"
  }
}
```

---

## 🛍️ Step 2: Update Shopify Theme Files

### A. Update otp-form.liquid Snippet

1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **Actions** → **Edit code**
3. In the left sidebar, find **Snippets** folder → `otp-form.liquid`
4. **Replace entire content** with the code from:
   ```
   shopify/otp-form.liquid
   ```
5. Click **Save**

**What this adds:**
- Customer ID hidden inputs
- Pre-verification check for customers with existing phone
- Store-verification API call after OTP success
- Auto-redirect to checkout after verification

---

### B. Verify Phone Verification Page Exists

1. Go to **Shopify Admin** → **Online Store** → **Pages**
2. Find page with URL `phone-verification`
3. If it exists, verify it contains:
   ```liquid
   {% render 'otp-form' %}
   ```
4. If it doesn't exist:
   - Click **Add page**
   - Title: `Phone Verification`
   - Content: (switch to HTML view `<>`)
   ```liquid
   <div class="page-width" style="padding:40px 0;">
     {% render 'otp-form' %}
   </div>
   ```
   - Template: `page.otp-verification` (or leave as default)
   - Click **Save**

**Page URL will be:** `/pages/phone-verification`

---

### C. Modify Cart Page (Critical!)

Follow the detailed guide in `shopify/CART-LIQUID-MODIFICATION.md`

**Quick version:**

1. Go to **Shopify Admin** → **Online Store** → **Themes** → **Edit code**
2. Find your cart file:
   - **Sections** → `main-cart.liquid` or `cart-template.liquid`
   - **Templates** → `cart.liquid`
3. Search for the checkout button (search for "checkout")
4. Replace the button with conditional logic:

```liquid
{% if customer %}
  {% if customer.phone == blank %}
    <a href="/pages/phone-verification?return=/checkout" class="btn">
      Verify Phone to Checkout
    </a>
  {% else %}
    <button type="submit" name="checkout" class="btn">
      Checkout
    </button>
  {% endif %}
{% else %}
  <a href="/account/login?return_url=/cart" class="btn">
    Login to Checkout
  </a>
{% endif %}
```

5. Click **Save**

---

## 🔐 Step 3: Configure Shopify Settings

### A. Require Customer Accounts

1. Go to **Shopify Admin** → **Settings** → **Checkout**
2. Scroll to **Customer accounts** section
3. Select **"Accounts are required"** (NOT optional)
4. Click **Save**

**Why:** This ensures customers must log in before accessing cart/checkout, making the `customer` object available in Liquid templates.

---

### B. Verify Environment Variables (Already Done)

Your Vercel project should already have these environment variables:
- `SHOPIFY_STORE_DOMAIN` = `hxnxj0-zq.myshopify.com`
- `SHOPIFY_ADMIN_API_TOKEN` = `shpat_...`
- `TWILIO_ACCOUNT_SID` = `AC...`
- `TWILIO_AUTH_TOKEN` = `...`
- `TWILIO_VERIFY_SERVICE_SID` = `VA...`
- `ALLOWED_ORIGIN` = `*` (or your specific domain)

If you need to add/verify:
1. Go to Vercel dashboard → Your project
2. Click **Settings** → **Environment Variables**
3. Add any missing variables
4. Redeploy the project

---

## ✅ Step 4: Testing

### Test Scenario 1: New Customer (No Phone)

1. Create a new customer account without phone:
   - Admin → Customers → Add customer
   - Email: `test@example.com`
   - Name: `Test User`
   - **Leave phone blank**
   - Click Save

2. Log in as this customer on your storefront
3. Add a product to cart
4. Go to cart (`/cart`)
5. **Expected:** See "Verify Phone to Checkout" button
6. Click button → redirects to `/pages/phone-verification?return=/checkout`
7. Enter phone number with country code
8. Click "Send OTP" → receive SMS
9. Enter 6-digit code
10. Click "Verify" → see success message
11. **Expected:** Auto-redirects to `/checkout` after 1.5 seconds
12. Check Shopify Admin → Customers → find test customer
13. **Expected:** Phone number is now populated

---

### Test Scenario 2: Existing Customer (Has Phone)

1. Log in with customer account that already has phone
2. Add product to cart
3. Go to cart
4. **Expected:** See normal "Checkout" button
5. Click → goes directly to checkout
6. **No OTP verification shown**

---

### Test Scenario 3: Already Verified Customer Visits Verification Page

1. Log in with customer that has phone
2. Visit `/pages/phone-verification?return=/checkout` directly
3. **Expected:** See green "Phone Already Verified" message with phone number
4. **Expected:** Auto-redirects to checkout after 2 seconds

---

### Test Scenario 4: Guest User

1. Log out
2. Add product to cart
3. Go to cart
4. **Expected:** See "Login to Checkout" button
5. Click → redirects to login page

---

## 🐛 Troubleshooting

### Issue: API returns "Customer not found"

**Cause:** Customer ID is invalid or doesn't exist

**Fix:** 
- Check that `{{ customer.id }}` outputs a valid number in Liquid
- Verify customer exists in Shopify Admin → Customers

---

### Issue: Phone not saving to customer account

**Cause:** Shopify API token lacks permissions

**Fix:**
1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps" → Your app
3. Ensure **Admin API scopes** include:
   - `read_customers`
   - `write_customers`
4. Reinstall access token if needed

---

### Issue: "Network error" when calling API

**Cause:** CORS issue or API not deployed

**Fix:**
- Verify API is deployed: https://fpv-lovat.vercel.app/api/store-verification
- Check browser console for specific error
- Ensure `ALLOWED_ORIGIN` includes your Shopify domain

---

### Issue: Customer can still access /checkout directly

**Limitation:** Shopify Growth plan cannot block the checkout page URL itself. Only the cart button is controlled.

**Workaround:**
- Most users follow the cart → checkout flow
- Determined users who type `/checkout` directly can bypass
- For full checkout page blocking, need Shopify Plus (checkout.liquid access)

---

### Issue: Button styling looks wrong

**Fix:** Use the same CSS classes from your original checkout button. Common classes:
- `btn`
- `button`
- `btn--primary`
- `cart__checkout-button`

---

## 📊 Monitoring & Logs

### Check API Logs

1. Go to Vercel dashboard → Your project
2. Click **Logs** tab
3. Filter by function: `api/store-verification`
4. Look for:
   - ✓ Success logs: `Customer {id} phone updated to {phone}`
   - ❌ Error logs: Shopify API errors, validation failures

### Check OTP Logs

1. Twilio Console → Verify → Services → Your service
2. View verification attempts
3. Check delivery status (sent, delivered, failed)

---

## 🎯 Summary Checklist

- [ ] Deploy `api/store-verification.js` to Vercel
- [ ] Update `otp-form.liquid` snippet in Shopify
- [ ] Create or verify `/pages/phone-verification` page exists
- [ ] Modify cart page checkout button with conditional logic
- [ ] Enable "Accounts are required" in Shopify settings
- [ ] Test with customer without phone (should redirect to verification)
- [ ] Test with customer with phone (should checkout normally)
- [ ] Test with logged out user (should show login button)
- [ ] Verify phone numbers save to Shopify customer records

---

## 🚀 You're Done!

Your checkout phone verification gate is now live. Customers without verified phone numbers will be required to complete OTP verification before accessing checkout. Once verified, their phone is stored permanently and they can checkout freely on future purchases.

**For support:** Check the troubleshooting section above or review API logs in Vercel.
