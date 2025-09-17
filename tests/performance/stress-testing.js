// K6 Stress Tests for Accounting SaaS
// Tests system behavior under extreme load conditions

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const timeoutRate = new Rate('timeout_rate');
const serverErrorRate = new Rate('server_error_rate');
const requestCount = new Counter('request_count');

// Stress test configuration
export const options = {
    stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '3m', target: 200 },  // Ramp up to 200 users
        { duration: '5m', target: 300 },  // Ramp up to 300 users
        { duration: '10m', target: 500 }, // Ramp up to 500 users (stress level)
        { duration: '5m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
        http_req_failed: ['rate<0.3'],     // Error rate under 30% (stress test)
        error_rate: ['rate<0.2'],          // Custom error rate under 20%
        timeout_rate: ['rate<0.1'],        // Timeout rate under 10%
        server_error_rate: ['rate<0.15'],  // Server error rate under 15%
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
        name: `Stress Customer ${Math.random().toString(36).substr(2, 9)}`,
        email: `stress${Math.random().toString(36).substr(2, 9)}@test.com`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    };
}

function generateInvoice(customerId) {
    return {
        customerId: customerId,
        amount: Math.floor(Math.random() * 50000) + 1000,
        currency: 'USD',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Stress Test Invoice ${Math.random().toString(36).substr(2, 9)}`,
        lineItems: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
            description: `Stress Item ${i + 1}`,
            quantity: Math.floor(Math.random() * 10) + 1,
            unitPrice: Math.floor(Math.random() * 1000) + 100,
            total: Math.floor(Math.random() * 10000) + 1000,
        })),
    };
}

function generateBill(vendorId) {
    return {
        vendorId: vendorId,
        amount: Math.floor(Math.random() * 25000) + 500,
        currency: 'USD',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Stress Test Bill ${Math.random().toString(36).substr(2, 9)}`,
        lineItems: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
            description: `Stress Service ${i + 1}`,
            quantity: Math.floor(Math.random() * 5) + 1,
            unitPrice: Math.floor(Math.random() * 500) + 50,
            total: Math.floor(Math.random() * 5000) + 500,
        })),
    };
}

function generatePayment(invoiceId, billId) {
    const amount = Math.floor(Math.random() * 5000) + 100;
    return {
        amount: amount,
        currency: 'USD',
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString(),
        description: `Stress Test Payment ${Math.random().toString(36).substr(2, 9)}`,
        allocations: [
            {
                type: 'INVOICE',
                entityId: invoiceId,
                amount: amount,
            },
        ],
    };
}

// Main test function
export default function () {
    requestCount.add(1);

    // Randomly select test scenario
    const scenario = Math.floor(Math.random() * 5);

    switch (scenario) {
        case 0:
            testHighVolumeCustomerCreation();
            break;
        case 1:
            testHighVolumeInvoiceProcessing();
            break;
        case 2:
            testHighVolumeBillProcessing();
            break;
        case 3:
            testHighVolumePaymentProcessing();
            break;
        case 4:
            testConcurrentReporting();
            break;
    }

    // Random sleep between 0.1 and 0.5 seconds
    sleep(Math.random() * 0.4 + 0.1);
}

function testHighVolumeCustomerCreation() {
    // Create multiple customers rapidly
    const customerCount = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < customerCount; i++) {
        const customerData = generateCustomer();
        const response = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), {
            headers,
            timeout: '10s' // 10 second timeout
        });

        const success = check(response, {
            'customer creation status is 201': (r) => r.status === 201,
            'customer creation response time < 5s': (r) => r.timings.duration < 5000,
            'customer creation no timeout': (r) => r.timings.duration < 10000,
        });

        errorRate.add(!success);
        responseTime.add(response.timings.duration);
        timeoutRate.add(response.timings.duration >= 10000);
        serverErrorRate.add(response.status >= 500);

        if (success && response.status === 201) {
            const customerId = JSON.parse(response.body).customer.id;

            // Immediately try to retrieve the customer
            const getResponse = http.get(`${BASE_URL}/api/customers/${customerId}`, {
                headers,
                timeout: '5s'
            });

            const getSuccess = check(getResponse, {
                'customer retrieval status is 200': (r) => r.status === 200,
                'customer retrieval response time < 3s': (r) => r.timings.duration < 3000,
            });

            errorRate.add(!getSuccess);
            responseTime.add(getResponse.timings.duration);
            serverErrorRate.add(getResponse.status >= 500);
        }
    }
}

function testHighVolumeInvoiceProcessing() {
    // Create customer first
    const customerData = generateCustomer();
    const customerResponse = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), {
        headers,
        timeout: '10s'
    });

    if (customerResponse.status === 201) {
        const customerId = JSON.parse(customerResponse.body).customer.id;

        // Create multiple invoices rapidly
        const invoiceCount = Math.floor(Math.random() * 10) + 1;
        const invoiceIds = [];

        for (let i = 0; i < invoiceCount; i++) {
            const invoiceData = generateInvoice(customerId);
            const response = http.post(`${BASE_URL}/api/invoices`, JSON.stringify(invoiceData), {
                headers,
                timeout: '15s'
            });

            const success = check(response, {
                'invoice creation status is 201': (r) => r.status === 201,
                'invoice creation response time < 5s': (r) => r.timings.duration < 5000,
                'invoice creation no timeout': (r) => r.timings.duration < 15000,
            });

            errorRate.add(!success);
            responseTime.add(response.timings.duration);
            timeoutRate.add(response.timings.duration >= 15000);
            serverErrorRate.add(response.status >= 500);

            if (success && response.status === 201) {
                const invoiceId = JSON.parse(response.body).invoice.id;
                invoiceIds.push(invoiceId);
            }
        }

        // Try to send all invoices concurrently
        const sendPromises = invoiceIds.map(invoiceId =>
            http.post(`${BASE_URL}/api/invoices/${invoiceId}/send`, null, {
                headers,
                timeout: '10s'
            })
        );

        // Process send responses
        sendPromises.forEach(response => {
            const success = check(response, {
                'invoice send status is 200': (r) => r.status === 200,
                'invoice send response time < 3s': (r) => r.timings.duration < 3000,
            });

            errorRate.add(!success);
            responseTime.add(response.timings.duration);
            serverErrorRate.add(response.status >= 500);
        });

        // Cleanup
        invoiceIds.forEach(invoiceId => {
            http.del(`${BASE_URL}/api/invoices/${invoiceId}`, null, { headers });
        });

        http.del(`${BASE_URL}/api/customers/${customerId}`, null, { headers });
    }
}

function testHighVolumeBillProcessing() {
    // Create vendor first
    const vendorData = generateCustomer(); // Reuse customer generator
    const vendorResponse = http.post(`${BASE_URL}/api/vendors`, JSON.stringify(vendorData), {
        headers,
        timeout: '10s'
    });

    if (vendorResponse.status === 201) {
        const vendorId = JSON.parse(vendorResponse.body).vendor.id;

        // Create multiple bills rapidly
        const billCount = Math.floor(Math.random() * 8) + 1;
        const billIds = [];

        for (let i = 0; i < billCount; i++) {
            const billData = generateBill(vendorId);
            const response = http.post(`${BASE_URL}/api/bills`, JSON.stringify(billData), {
                headers,
                timeout: '15s'
            });

            const success = check(response, {
                'bill creation status is 201': (r) => r.status === 201,
                'bill creation response time < 5s': (r) => r.timings.duration < 5000,
                'bill creation no timeout': (r) => r.timings.duration < 15000,
            });

            errorRate.add(!success);
            responseTime.add(response.timings.duration);
            timeoutRate.add(response.timings.duration >= 15000);
            serverErrorRate.add(response.status >= 500);

            if (success && response.status === 201) {
                const billId = JSON.parse(response.body).bill.id;
                billIds.push(billId);
            }
        }

        // Try to approve all bills concurrently
        const approvePromises = billIds.map(billId =>
            http.post(`${BASE_URL}/api/bills/${billId}/approve`, null, {
                headers,
                timeout: '10s'
            })
        );

        // Process approve responses
        approvePromises.forEach(response => {
            const success = check(response, {
                'bill approval status is 200': (r) => r.status === 200,
                'bill approval response time < 3s': (r) => r.timings.duration < 3000,
            });

            errorRate.add(!success);
            responseTime.add(response.timings.duration);
            serverErrorRate.add(response.status >= 500);
        });

        // Cleanup
        billIds.forEach(billId => {
            http.del(`${BASE_URL}/api/bills/${billId}`, null, { headers });
        });

        http.del(`${BASE_URL}/api/vendors/${vendorId}`, null, { headers });
    }
}

function testHighVolumePaymentProcessing() {
    // Create customer and invoice first
    const customerData = generateCustomer();
    const customerResponse = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), {
        headers,
        timeout: '10s'
    });

    if (customerResponse.status === 201) {
        const customerId = JSON.parse(customerResponse.body).customer.id;

        const invoiceData = generateInvoice(customerId);
        const invoiceResponse = http.post(`${BASE_URL}/api/invoices`, JSON.stringify(invoiceData), {
            headers,
            timeout: '15s'
        });

        if (invoiceResponse.status === 201) {
            const invoiceId = JSON.parse(invoiceResponse.body).invoice.id;

            // Create multiple payments rapidly
            const paymentCount = Math.floor(Math.random() * 15) + 1;
            const paymentIds = [];

            for (let i = 0; i < paymentCount; i++) {
                const paymentData = generatePayment(invoiceId, null);
                const response = http.post(`${BASE_URL}/api/payments`, JSON.stringify(paymentData), {
                    headers,
                    timeout: '15s'
                });

                const success = check(response, {
                    'payment creation status is 201': (r) => r.status === 201,
                    'payment creation response time < 5s': (r) => r.timings.duration < 5000,
                    'payment creation no timeout': (r) => r.timings.duration < 15000,
                });

                errorRate.add(!success);
                responseTime.add(response.timings.duration);
                timeoutRate.add(response.timings.duration >= 15000);
                serverErrorRate.add(response.status >= 500);

                if (success && response.status === 201) {
                    const paymentId = JSON.parse(response.body).payment.id;
                    paymentIds.push(paymentId);
                }
            }

            // Cleanup
            paymentIds.forEach(paymentId => {
                http.del(`${BASE_URL}/api/payments/${paymentId}`, null, { headers });
            });

            http.del(`${BASE_URL}/api/invoices/${invoiceId}`, null, { headers });
        }

        http.del(`${BASE_URL}/api/customers/${customerId}`, null, { headers });
    }
}

function testConcurrentReporting() {
    // Test multiple reporting endpoints concurrently
    const endpoints = [
        '/api/reports/dashboard',
        '/api/reports/trial-balance',
        '/api/reports/balance-sheet',
        '/api/reports/profit-loss',
        '/api/reports/cash-flow',
        '/api/reports/aged-receivables',
        '/api/reports/aged-payables',
    ];

    // Select random subset of endpoints
    const selectedEndpoints = endpoints.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1);

    const reportPromises = selectedEndpoints.map(endpoint =>
        http.get(`${BASE_URL}${endpoint}`, {
            headers,
            timeout: '20s'
        })
    );

    // Process all report responses
    reportPromises.forEach((response, index) => {
        const endpoint = selectedEndpoints[index];
        const success = check(response, {
            [`${endpoint} status is 200`]: (r) => r.status === 200,
            [`${endpoint} response time < 10s`]: (r) => r.timings.duration < 10000,
            [`${endpoint} no timeout`]: (r) => r.timings.duration < 20000,
        });

        errorRate.add(!success);
        responseTime.add(response.timings.duration);
        timeoutRate.add(response.timings.duration >= 20000);
        serverErrorRate.add(response.status >= 500);
    });
}

// Setup and teardown
export function setup() {
    console.log('Starting K6 stress tests...');
    console.log('This test will gradually increase load to stress the system');
    return { startTime: new Date().toISOString() };
}

export function teardown(data) {
    console.log(`Stress tests completed at ${new Date().toISOString()}`);
    console.log(`Test started at: ${data.startTime}`);
    console.log('Check the metrics above for system behavior under stress');
}
