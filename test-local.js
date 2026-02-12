// Quick local test script — simulates a Vercel request to api/send-otp.js
require('dotenv').config();

const handler = require('./api/send-otp');

// Mock Vercel req/res objects
function createMockReqRes(method, body) {
    const req = { method, body };
    const headers = {};
    const res = {
        statusCode: null,
        body: null,
        setHeader(key, val) { headers[key] = val; },
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; console.log(`\n[${this.statusCode}] Response:`); console.log(JSON.stringify(data, null, 2)); return this; },
        end() { return this; },
    };
    return { req, res };
}

async function runTests() {
    console.log('=== Test 1: Missing phone ===');
    const t1 = createMockReqRes('POST', {});
    await handler(t1.req, t1.res);

    console.log('\n=== Test 2: Invalid phone format ===');
    const t2 = createMockReqRes('POST', { phone: '12345' });
    await handler(t2.req, t2.res);

    console.log('\n=== Test 3: Wrong HTTP method ===');
    const t3 = createMockReqRes('GET', {});
    await handler(t3.req, t3.res);

    console.log('\n=== Test 4: Send OTP (live Twilio call) ===');
    const t4 = createMockReqRes('POST', { phone: '+94771234567' });
    await handler(t4.req, t4.res);
}

runTests().catch(console.error);
