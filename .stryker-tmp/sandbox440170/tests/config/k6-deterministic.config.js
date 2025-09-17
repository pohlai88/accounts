// @ts-nocheck
// Deterministic K6 Performance Test Configuration
// Ensures consistent, reproducible performance test results

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Deterministic test configuration
export const options = {
    // Deterministic test stages
    stages: [
        { duration: '1m', target: 10 },   // Ramp up to 10 users
        { duration: '2m', target: 10 },   // Stay at 10 users
        { duration: '1m', target: 20 },   // Ramp up to 20 users
        { duration: '2m', target: 20 },   // Stay at 20 users
        { duration: '1m', target: 0 },    // Ramp down
    ],

    // Deterministic thresholds
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
        http_req_failed: ['rate<0.05'],    // Error rate under 5%
        http_req_waiting: ['p(95)<1000'],  // 95% of requests waiting under 1s
        http_req_connecting: ['p(95)<500'], // 95% of requests connecting under 500ms
    },

    // Deterministic execution settings
    iterations: 100, // Fixed number of iterations
    vus: 10, // Fixed number of virtual users

    // Deterministic timeouts
    duration: '5m', // Fixed test duration
    maxRedirects: 5,

    // Deterministic environment
    env: {
        TEST_DETERMINISTIC: 'true',
        TEST_SEED: '12345',
        BASE_URL: __ENV.BASE_URL || 'http://localhost:3000',
        API_KEY: __ENV.API_KEY || 'test-api-key',
    },
};

// Deterministic test data
const DETERMINISTIC_DATA = {
    customers: [
        { id: 'customer-001', name: 'Test Customer 1', email: 'customer1@test.com.my' },
        { id: 'customer-002', name: 'Test Customer 2', email: 'customer2@test.com.my' },
        { id: 'customer-003', name: 'Test Customer 3', email: 'customer3@test.com.my' },
    ],
    vendors: [
        { id: 'vendor-001', name: 'Test Vendor 1', email: 'vendor1@test.com.my' },
        { id: 'vendor-002', name: 'Test Vendor 2', email: 'vendor2@test.com.my' },
        { id: 'vendor-003', name: 'Test Vendor 3', email: 'vendor3@test.com.my' },
    ],
    invoices: [
        { id: 'invoice-001', amount: 1000, currency: 'MYR' },
        { id: 'invoice-002', amount: 2000, currency: 'MYR' },
        { id: 'invoice-003', amount: 3000, currency: 'MYR' },
    ],
    bills: [
        { id: 'bill-001', amount: 500, currency: 'MYR' },
        { id: 'bill-002', amount: 1000, currency: 'MYR' },
        { id: 'bill-003', amount: 1500, currency: 'MYR' },
    ],
};

// Deterministic data selection
function getDeterministicData(type, index) {
    const data = DETERMINISTIC_DATA[type];
    return data[index % data.length];
}

// Deterministic test scenarios
export default function () {
    // Deterministic test sequence
    const testSequence = [
        'testCustomerManagement',
        'testInvoiceManagement',
        'testBillManagement',
        'testPaymentProcessing',
        'testReporting',
    ];

    // Select test based on iteration for deterministic execution
    const testIndex = __ITER % testSequence.length;
    const testName = testSequence[testIndex];

    // Execute selected test
    switch (testName) {
        case 'testCustomerManagement':
            testCustomerManagement();
            break;
        case 'testInvoiceManagement':
            testInvoiceManagement();
            break;
        case 'testBillManagement':
            testBillManagement();
            break;
        case 'testPaymentProcessing':
            testPaymentProcessing();
            break;
        case 'testReporting':
            testReporting();
            break;
    }

    // Deterministic sleep
    sleep(1);
}

function testCustomerManagement() {
    const customer = getDeterministicData('customers', __ITER);

    // Create customer
    const createResponse = http.post(`${__ENV.BASE_URL}/api/customers`, JSON.stringify(customer), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(createResponse, {
        'customer creation status is 201': (r) => r.status === 201,
        'customer creation response time < 2s': (r) => r.timings.duration < 2000,
    });

    if (createResponse.status === 201) {
        const customerId = JSON.parse(createResponse.body).customer.id;

        // Get customer
        const getResponse = http.get(`${__ENV.BASE_URL}/api/customers/${customerId}`, {
            headers: { 'Content-Type': 'application/json' },
        });

        check(getResponse, {
            'customer retrieval status is 200': (r) => r.status === 200,
            'customer retrieval response time < 1s': (r) => r.timings.duration < 1000,
        });
    }
}

function testInvoiceManagement() {
    const customer = getDeterministicData('customers', __ITER);
    const invoice = getDeterministicData('invoices', __ITER);

    // Create customer first
    const customerResponse = http.post(`${__ENV.BASE_URL}/api/customers`, JSON.stringify(customer), {
        headers: { 'Content-Type': 'application/json' },
    });

    if (customerResponse.status === 201) {
        const customerId = JSON.parse(customerResponse.body).customer.id;

        // Create invoice
        const invoiceData = {
            ...invoice,
            customerId: customerId,
            dueDate: '2024-02-01',
            description: 'Test Invoice',
        };

        const invoiceResponse = http.post(`${__ENV.BASE_URL}/api/invoices`, JSON.stringify(invoiceData), {
            headers: { 'Content-Type': 'application/json' },
        });

        check(invoiceResponse, {
            'invoice creation status is 201': (r) => r.status === 201,
            'invoice creation response time < 2s': (r) => r.timings.duration < 2000,
        });
    }
}

function testBillManagement() {
    const vendor = getDeterministicData('vendors', __ITER);
    const bill = getDeterministicData('bills', __ITER);

    // Create vendor first
    const vendorResponse = http.post(`${__ENV.BASE_URL}/api/vendors`, JSON.stringify(vendor), {
        headers: { 'Content-Type': 'application/json' },
    });

    if (vendorResponse.status === 201) {
        const vendorId = JSON.parse(vendorResponse.body).vendor.id;

        // Create bill
        const billData = {
            ...bill,
            vendorId: vendorId,
            dueDate: '2024-02-15',
            description: 'Test Bill',
        };

        const billResponse = http.post(`${__ENV.BASE_URL}/api/bills`, JSON.stringify(billData), {
            headers: { 'Content-Type': 'application/json' },
        });

        check(billResponse, {
            'bill creation status is 201': (r) => r.status === 201,
            'bill creation response time < 2s': (r) => r.timings.duration < 2000,
        });
    }
}

function testPaymentProcessing() {
    const payment = {
        amount: 1000,
        currency: 'MYR',
        paymentMethod: 'CASH',
        paymentDate: '2024-01-15',
        description: 'Test Payment',
    };

    const paymentResponse = http.post(`${__ENV.BASE_URL}/api/payments`, JSON.stringify(payment), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(paymentResponse, {
        'payment creation status is 201': (r) => r.status === 201,
        'payment creation response time < 2s': (r) => r.timings.duration < 2000,
    });
}

function testReporting() {
    const endpoints = [
        '/api/reports/dashboard',
        '/api/reports/trial-balance',
        '/api/reports/balance-sheet',
        '/api/reports/profit-loss',
    ];

    endpoints.forEach(endpoint => {
        const response = http.get(`${__ENV.BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
        });

        check(response, {
            [`${endpoint} status is 200`]: (r) => r.status === 200,
            [`${endpoint} response time < 3s`]: (r) => r.timings.duration < 3000,
        });
    });
}

// Deterministic setup and teardown
export function setup() {
    console.log('Starting deterministic K6 performance tests...');
    console.log('Test seed: 12345');
    console.log('Base URL:', __ENV.BASE_URL);
    return { startTime: new Date().toISOString() };
}

export function teardown(data) {
    console.log(`Deterministic performance tests completed at ${new Date().toISOString()}`);
    console.log(`Test started at: ${data.startTime}`);
}
