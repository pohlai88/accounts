/**
 * Simple verification script for API Gateway responses
 */

// Import the response functions
import { ok, created, notFound, serverErr, unauthorized } from './src/response.js';

console.log('🧪 Testing API Gateway Response System...\n');

// Test OK response
const okResponse = ok({ message: "Hello World" }, "Success");
console.log('✅ OK Response:', JSON.stringify(okResponse, null, 2));

// Test Created response
const createdResponse = created({ id: "123", name: "Test" });
console.log('\n✅ Created Response:', JSON.stringify(createdResponse, null, 2));

// Test Not Found response
const notFoundResponse = notFound("RESOURCE_NOT_FOUND", "User not found");
console.log('\n✅ Not Found Response:', JSON.stringify(notFoundResponse, null, 2));

// Test Unauthorized response
const unauthorizedResponse = unauthorized("INVALID_TOKEN", "Token expired");
console.log('\n✅ Unauthorized Response:', JSON.stringify(unauthorizedResponse, null, 2));

// Test Server Error response
const serverErrorResponse = serverErr("DATABASE_ERROR", "Connection failed", { requestId: "req-123" });
console.log('\n✅ Server Error Response:', JSON.stringify(serverErrorResponse, null, 2));

// Validate response structure
console.log('\n🔍 Validating Response Structure...');

const responses = [okResponse, createdResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse];

responses.forEach((response, index) => {
    const hasSuccess = response.hasOwnProperty('success');
    const hasStatus = response.hasOwnProperty('status');
    const successType = typeof response.success === 'boolean';
    const statusType = typeof response.status === 'number';

    if (response.success) {
        const hasData = response.hasOwnProperty('data');
        console.log(`Response ${index + 1}: ${hasSuccess && hasStatus && successType && statusType && hasData ? '✅' : '❌'} (Success)`);
    } else {
        const hasError = response.hasOwnProperty('error');
        const hasErrorCode = response.error && response.error.hasOwnProperty('code');
        const hasErrorMessage = response.error && response.error.hasOwnProperty('message');
        console.log(`Response ${index + 1}: ${hasSuccess && hasStatus && successType && statusType && hasError && hasErrorCode && hasErrorMessage ? '✅' : '❌'} (Error)`);
    }
});

console.log('\n🎉 API Gateway Response System Verification Complete!');
