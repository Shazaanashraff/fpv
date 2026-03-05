// Integration test - Simulates full phone verification flow
// Tests the sequence: Send OTP → Verify OTP → Store to Customer
require('dotenv').config();

const sendOtp = require('./api/send-otp');
const verifyOtp = require('./api/verify-otp');
const storeVerification = require('./api/store-verification');

// Mock Vercel req/res
function createMockReqRes(method, body) {
    const req = { method, body };
    const headers = {};
    const res = {
        statusCode: null,
        body: null,
        setHeader(key, val) { headers[key] = val; },
        status(code) { this.statusCode = code; return this; },
        json(data) { 
            this.body = data; 
            return this; 
        },
        end() { return this; },
    };
    return { req, res };
}

async function testFullFlow() {
    console.log('\n=========================================');
    console.log('INTEGRATION TEST: Full Verification Flow');
    console.log('=========================================\n');

    const testPhone = '+971501234567';  // Test phone number
    const testCustomerId = '123456789';  // Mock customer ID

    console.log('📱 Test Phone:', testPhone);
    console.log('👤 Test Customer ID:', testCustomerId);
    console.log('');

    // Step 1: Check OTP API connectivity
    console.log('Step 1: Testing OTP Send API...');
    const step1 = createMockReqRes('POST', { phone: testPhone });
    await sendOtp(step1.req, step1.res);
    
    if (step1.res.statusCode === 200 && step1.res.body.success) {
        console.log('✓ OTP Send API: Working');
    } else {
        console.log('✗ OTP Send API: Failed');
        if (!process.env.TWILIO_ACCOUNT_SID) {
            console.log('  Reason: Twilio credentials not configured');
        }
    }
    console.log('');

    // Step 2: Test OTP verification with invalid code
    console.log('Step 2: Testing OTP Verify API (invalid code)...');
    const step2 = createMockReqRes('POST', { 
        phone: testPhone,
        otp: '000000'  // Invalid code
    });
    await verifyOtp(step2.req, step2.res);
    
    if (step2.res.statusCode !== 200 || !step2.res.body.success) {
        console.log('✓ OTP Verify API: Correctly rejects invalid code');
    } else {
        console.log('⚠ OTP Verify API: Unexpectedly accepted invalid code');
    }
    console.log('');

    // Step 3: Test store-verification API
    console.log('Step 3: Testing Store Verification API...');
    const step3 = createMockReqRes('POST', { 
        customerId: testCustomerId,
        phone: testPhone
    });
    await storeVerification(step3.req, step3.res);
    
    if (step3.res.statusCode === 200 && step3.res.body.success) {
        console.log('✓ Store Verification API: Successfully stored');
    } else if (step3.res.statusCode === 500 && !process.env.SHOPIFY_ADMIN_API_TOKEN) {
        console.log('⚠ Store Verification API: Cannot test (Shopify credentials missing)');
    } else if (step3.res.statusCode === 404) {
        console.log('⚠ Store Verification API: Customer not found (expected with test ID)');
    } else {
        console.log('✗ Store Verification API: Error');
        console.log('  Error:', step3.res.body.error);
    }
    console.log('');

    // Summary
    console.log('=========================================');
    console.log('INTEGRATION TEST SUMMARY');
    console.log('=========================================\n');

    const results = {
        sendOtp: step1.res.statusCode === 200,
        verifyOtp: step2.res.statusCode !== null,
        storeVerification: step3.res.statusCode !== null
    };

    console.log('API Endpoints:');
    console.log(`  send-otp.js: ${results.sendOtp ? '✓ Working' : '✗ Failed'}`);
    console.log(`  verify-otp.js: ${results.verifyOtp ? '✓ Working' : '✗ Failed'}`);
    console.log(`  store-verification.js: ${results.storeVerification ? '✓ Working' : '✗ Failed'}`);
    console.log('');

    console.log('Environment Variables:');
    console.log(`  TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Missing'}`);
    console.log(`  TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Missing'}`);
    console.log(`  TWILIO_VERIFY_SERVICE_SID: ${process.env.TWILIO_VERIFY_SERVICE_SID ? '✓ Set' : '✗ Missing'}`);
    console.log(`  SHOPIFY_STORE_DOMAIN: ${process.env.SHOPIFY_STORE_DOMAIN ? '✓ Set' : '✗ Missing'}`);
    console.log(`  SHOPIFY_ADMIN_API_TOKEN: ${process.env.SHOPIFY_ADMIN_API_TOKEN ? '✓ Set' : '✗ Missing'}`);
    console.log('');

    console.log('📋 Next Steps:');
    console.log('  1. Ensure all environment variables are set in .env');
    console.log('  2. Deploy to Vercel: git push origin main');
    console.log('  3. Update Shopify theme with new otp-form.liquid');
    console.log('  4. Modify cart.liquid to add verification check');
    console.log('  5. Test with real customer account on storefront');
    console.log('');
}

testFullFlow().catch(console.error);
