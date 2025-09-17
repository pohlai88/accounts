// K6 Performance Tests for Accounting SaaS
// Tests load, stress, and endurance scenarios

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
    stages: [
        { duration: '2m', target: 10 }, // Ramp up
        { duration: '5m', target: 10 }, // Stay at 10 users
        { duration: '2m', target: 20 }, // Ramp up to 20 users
        { duration: '5m', target: 20 }, // Stay at 20 users
        { duration: '2m', target: 0 },  // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
        http_req_failed: ['rate<0.1'],     // Error rate under 10%
        error_rate: ['rate<0.05'],         // Custom error rate under 5%
    },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-api-key';

// Headers
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
};

// Test data generators
function generateCustomer() {
    return {
        name: `Customer ${Math.random().toString(36).substr(2, 9)}`,
        email: `customer${Math.random().toString(36).substr(2, 9)}@test.com`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    };
}

function generateInvoice(customerId) {
    return {
        customerId: customerId,
        amount: Math.floor(Math.random() * 10000) + 100,
        currency: 'USD',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Test Invoice ${Math.random().toString(36).substr(2, 9)}`,
        lineItems: [
            {
                description: 'Test Item',
                quantity: 1,
                unitPrice: Math.floor(Math.random() * 10000) + 100,
                total: Math.floor(Math.random() * 10000) + 100,
            },
        ],
    };
}

function generateBill(vendorId) {
    return {
        vendorId: vendorId,
        amount: Math.floor(Math.random() * 5000) + 50,
        currency: 'USD',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Test Bill ${Math.random().toString(36).substr(2, 9)}`,
        lineItems: [
            {
                description: 'Test Service',
                quantity: 1,
                unitPrice: Math.floor(Math.random() * 5000) + 50,
                total: Math.floor(Math.random() * 5000) + 50,
            },
        ],
    };
}

function generatePayment(invoiceId, billId) {
    const amount = Math.floor(Math.random() * 1000) + 100;
    return {
        amount: amount,
        currency: 'USD',
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString(),
        description: `Test Payment ${Math.random().toString(36).substr(2, 9)}`,
        allocations: [
            {
                type: 'INVOICE',
                entityId: invoiceId,
                amount: amount,
            },
        ],
    };
}

// Test scenarios
export default function () {
    // Scenario 1: Customer Management
    testCustomerManagement();

    // Scenario 2: Invoice Management
    testInvoiceManagement();

    // Scenario 3: Bill Management
    testBillManagement();

    // Scenario 4: Payment Processing
    testPaymentProcessing();

    // Scenario 5: Reporting
    testReporting();

    sleep(1);
}

function testCustomerManagement() {
    // Create customer
    const customerData = generateCustomer();
    const createResponse = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), { headers });

    const createSuccess = check(createResponse, {
        'customer creation status is 201': (r) => r.status === 201,
        'customer creation response time < 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!createSuccess);
    responseTime.add(createResponse.timings.duration);

    if (createSuccess) {
        const customerId = JSON.parse(createResponse.body).customer.id;

        // Get customer
        const getResponse = http.get(`${BASE_URL}/api/customers/${customerId}`, { headers });

        const getSuccess = check(getResponse, {
            'customer retrieval status is 200': (r) => r.status === 200,
            'customer retrieval response time < 1s': (r) => r.timings.duration < 1000,
        });

        errorRate.add(!getSuccess);
        responseTime.add(getResponse.timings.duration);

        // Update customer
        const updateData = { name: `Updated ${customerData.name}` };
        const updateResponse = http.put(`${BASE_URL}/api/customers/${customerId}`, JSON.stringify(updateData), { headers });

        const updateSuccess = check(updateResponse, {
            'customer update status is 200': (r) => r.status === 200,
            'customer update response time < 1s': (r) => r.timings.duration < 1000,
        });

        errorRate.add(!updateSuccess);
        responseTime.add(updateResponse.timings.duration);

        // Delete customer
        const deleteResponse = http.del(`${BASE_URL}/api/customers/${customerId}`, null, { headers });

        const deleteSuccess = check(deleteResponse, {
            'customer deletion status is 200': (r) => r.status === 200,
            'customer deletion response time < 1s': (r) => r.timings.duration < 1000,
        });

        errorRate.add(!deleteSuccess);
        responseTime.add(deleteResponse.timings.duration);
    }
}

function testInvoiceManagement() {
    // Create customer first
    const customerData = generateCustomer();
    const customerResponse = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), { headers });

    if (customerResponse.status === 201) {
        const customerId = JSON.parse(customerResponse.body).customer.id;

        // Create invoice
        const invoiceData = generateInvoice(customerId);
        const createResponse = http.post(`${BASE_URL}/api/invoices`, JSON.stringify(invoiceData), { headers });

        const createSuccess = check(createResponse, {
            'invoice creation status is 201': (r) => r.status === 201,
            'invoice creation response time < 2s': (r) => r.timings.duration < 2000,
        });

        errorRate.add(!createSuccess);
        responseTime.add(createResponse.timings.duration);

        if (createSuccess) {
            const invoiceId = JSON.parse(createResponse.body).invoice.id;

            // Get invoice
            const getResponse = http.get(`${BASE_URL}/api/invoices/${invoiceId}`, { headers });

            const getSuccess = check(getResponse, {
                'invoice retrieval status is 200': (r) => r.status === 200,
                'invoice retrieval response time < 1s': (r) => r.timings.duration < 1000,
            });

            errorRate.add(!getSuccess);
            responseTime.add(getResponse.timings.duration);

            // Send invoice
            const sendResponse = http.post(`${BASE_URL}/api/invoices/${invoiceId}/send`, null, { headers });

            const sendSuccess = check(sendResponse, {
                'invoice send status is 200': (r) => r.status === 200,
                'invoice send response time < 1s': (r) => r.timings.duration < 1000,
            });

            errorRate.add(!sendSuccess);
            responseTime.add(sendResponse.timings.duration);

            // Delete invoice
            const deleteResponse = http.del(`${BASE_URL}/api/invoices/${invoiceId}`, null, { headers });

            const deleteSuccess = check(deleteResponse, {
                'invoice deletion status is 200': (r) => r.status === 200,
                'invoice deletion response time < 1s': (r) => r.timings.duration < 1000,
            });

            errorRate.add(!deleteSuccess);
            responseTime.add(deleteResponse.timings.duration);
        }

        // Cleanup customer
        http.del(`${BASE_URL}/api/customers/${customerId}`, null, { headers });
    }
}

function testBillManagement() {
    // Create vendor first
    const vendorData = generateCustomer(); // Reuse customer generator for vendor
    const vendorResponse = http.post(`${BASE_URL}/api/vendors`, JSON.stringify(vendorData), { headers });

    if (vendorResponse.status === 201) {
        const vendorId = JSON.parse(vendorResponse.body).vendor.id;

        // Create bill
        const billData = generateBill(vendorId);
        const createResponse = http.post(`${BASE_URL}/api/bills`, JSON.stringify(billData), { headers });

        const createSuccess = check(createResponse, {
            'bill creation status is 201': (r) => r.status === 201,
            'bill creation response time < 2s': (r) => r.timings.duration < 2000,
        });

        errorRate.add(!createSuccess);
        responseTime.add(createResponse.timings.duration);

        if (createSuccess) {
            const billId = JSON.parse(createResponse.body).bill.id;

            // Get bill
            const getResponse = http.get(`${BASE_URL}/api/bills/${billId}`, { headers });

            const getSuccess = check(getResponse, {
                'bill retrieval status is 200': (r) => r.status === 200,
                'bill retrieval response time < 1s': (r) => r.timings.duration < 1000,
            });

            errorRate.add(!getSuccess);
            responseTime.add(getResponse.timings.duration);

            // Approve bill
            const approveResponse = http.post(`${BASE_URL}/api/bills/${billId}/approve`, null, { headers });

            const approveSuccess = check(approveResponse, {
                'bill approval status is 200': (r) => r.status === 200,
                'bill approval response time < 1s': (r) => r.timings.duration < 1000,
            });

            errorRate.add(!approveSuccess);
            responseTime.add(approveResponse.timings.duration);

            // Delete bill
            const deleteResponse = http.del(`${BASE_URL}/api/bills/${billId}`, null, { headers });

            const deleteSuccess = check(deleteResponse, {
                'bill deletion status is 200': (r) => r.status === 200,
                'bill deletion response time < 1s': (r) => r.timings.duration < 1000,
            });

            errorRate.add(!deleteSuccess);
            responseTime.add(deleteResponse.timings.duration);
        }

        // Cleanup vendor
        http.del(`${BASE_URL}/api/vendors/${vendorId}`, null, { headers });
    }
}

function testPaymentProcessing() {
    // Create customer and invoice first
    const customerData = generateCustomer();
    const customerResponse = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), { headers });

    if (customerResponse.status === 201) {
        const customerId = JSON.parse(customerResponse.body).customer.id;

        const invoiceData = generateInvoice(customerId);
        const invoiceResponse = http.post(`${BASE_URL}/api/invoices`, JSON.stringify(invoiceData), { headers });

        if (invoiceResponse.status === 201) {
            const invoiceId = JSON.parse(invoiceResponse.body).invoice.id;

            // Create payment
            const paymentData = generatePayment(invoiceId, null);
            const createResponse = http.post(`${BASE_URL}/api/payments`, JSON.stringify(paymentData), { headers });

            const createSuccess = check(createResponse, {
                'payment creation status is 201': (r) => r.status === 201,
                'payment creation response time < 2s': (r) => r.timings.duration < 2000,
            });

            errorRate.add(!createSuccess);
            responseTime.add(createResponse.timings.duration);

            if (createSuccess) {
                const paymentId = JSON.parse(createResponse.body).payment.id;

                // Get payment
                const getResponse = http.get(`${BASE_URL}/api/payments/${paymentId}`, { headers });

                const getSuccess = check(getResponse, {
                    'payment retrieval status is 200': (r) => r.status === 200,
                    'payment retrieval response time < 1s': (r) => r.timings.duration < 1000,
                });

                errorRate.add(!getSuccess);
                responseTime.add(getResponse.timings.duration);

                // Delete payment
                const deleteResponse = http.del(`${BASE_URL}/api/payments/${paymentId}`, null, { headers });

                const deleteSuccess = check(deleteResponse, {
                    'payment deletion status is 200': (r) => r.status === 200,
                    'payment deletion response time < 1s': (r) => r.timings.duration < 1000,
                });

                errorRate.add(!deleteSuccess);
                responseTime.add(deleteResponse.timings.duration);
            }

            // Cleanup invoice
            http.del(`${BASE_URL}/api/invoices/${invoiceId}`, null, { headers });
        }

        // Cleanup customer
        http.del(`${BASE_URL}/api/customers/${customerId}`, null, { headers });
    }
}

function testReporting() {
    // Test various reporting endpoints
    const endpoints = [
        '/api/reports/dashboard',
        '/api/reports/trial-balance',
        '/api/reports/balance-sheet',
        '/api/reports/profit-loss',
        '/api/reports/cash-flow',
    ];

    endpoints.forEach(endpoint => {
        const response = http.get(`${BASE_URL}${endpoint}`, { headers });

        const success = check(response, {
            [`${endpoint} status is 200`]: (r) => r.status === 200,
            [`${endpoint} response time < 3s`]: (r) => r.timings.duration < 3000,
        });

        errorRate.add(!success);
        responseTime.add(response.timings.duration);
    });
}

// Setup and teardown
export function setup() {
    console.log('Starting K6 performance tests...');
    return { startTime: new Date().toISOString() };
}

export function teardown(data) {
    console.log(`Performance tests completed at ${new Date().toISOString()}`);
    console.log(`Test started at: ${data.startTime}`);
}
