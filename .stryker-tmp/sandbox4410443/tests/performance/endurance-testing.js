// @ts-nocheck
// K6 Endurance Tests for Accounting SaaS
// Tests system stability over extended periods

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const memoryUsage = new Gauge('memory_usage');
const cpuUsage = new Gauge('cpu_usage');
const requestCount = new Counter('request_count');
const successCount = new Counter('success_count');

// Endurance test configuration
export const options = {
    stages: [
        { duration: '2m', target: 20 },   // Ramp up to 20 users
        { duration: '30m', target: 20 },  // Stay at 20 users for 30 minutes
        { duration: '2m', target: 40 },   // Ramp up to 40 users
        { duration: '30m', target: 40 },  // Stay at 40 users for 30 minutes
        { duration: '2m', target: 60 },   // Ramp up to 60 users
        { duration: '30m', target: 60 },  // Stay at 60 users for 30 minutes
        { duration: '2m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
        http_req_failed: ['rate<0.05'],    // Error rate under 5%
        error_rate: ['rate<0.03'],         // Custom error rate under 3%
        memory_usage: ['value<1000000000'], // Memory usage under 1GB
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
        name: `Endurance Customer ${Math.random().toString(36).substr(2, 9)}`,
        email: `endurance${Math.random().toString(36).substr(2, 9)}@test.com`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    };
}

function generateInvoice(customerId) {
    return {
        customerId: customerId,
        amount: Math.floor(Math.random() * 10000) + 100,
        currency: 'USD',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Endurance Test Invoice ${Math.random().toString(36).substr(2, 9)}`,
        lineItems: [
            {
                description: 'Endurance Test Item',
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
        description: `Endurance Test Bill ${Math.random().toString(36).substr(2, 9)}`,
        lineItems: [
            {
                description: 'Endurance Test Service',
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
        description: `Endurance Test Payment ${Math.random().toString(36).substr(2, 9)}`,
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
    const scenario = Math.floor(Math.random() * 6);

    switch (scenario) {
        case 0:
            testSustainedCustomerOperations();
            break;
        case 1:
            testSustainedInvoiceOperations();
            break;
        case 2:
            testSustainedBillOperations();
            break;
        case 3:
            testSustainedPaymentOperations();
            break;
        case 4:
            testSustainedReportingOperations();
            break;
        case 5:
            testSustainedMixedOperations();
            break;
    }

    // Random sleep between 0.5 and 2 seconds
    sleep(Math.random() * 1.5 + 0.5);
}

function testSustainedCustomerOperations() {
    // Create customer
    const customerData = generateCustomer();
    const createResponse = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), {
        headers,
        timeout: '10s'
    });

    const createSuccess = check(createResponse, {
        'customer creation status is 201': (r) => r.status === 201,
        'customer creation response time < 3s': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!createSuccess);
    responseTime.add(createResponse.timings.duration);
    if (createSuccess) successCount.add(1);

    if (createSuccess && createResponse.status === 201) {
        const customerId = JSON.parse(createResponse.body).customer.id;

        // Perform multiple operations on the customer
        const operations = [
            () => http.get(`${BASE_URL}/api/customers/${customerId}`, { headers }),
            () => http.put(`${BASE_URL}/api/customers/${customerId}`, JSON.stringify({ name: `Updated ${customerData.name}` }), { headers }),
            () => http.get(`${BASE_URL}/api/customers`, { headers }),
        ];

        operations.forEach(operation => {
            const response = operation();
            const success = check(response, {
                'customer operation status is 200': (r) => r.status === 200,
                'customer operation response time < 2s': (r) => r.timings.duration < 2000,
            });

            errorRate.add(!success);
            responseTime.add(response.timings.duration);
            if (success) successCount.add(1);
        });

        // Cleanup
        const deleteResponse = http.del(`${BASE_URL}/api/customers/${customerId}`, null, { headers });
        const deleteSuccess = check(deleteResponse, {
            'customer deletion status is 200': (r) => r.status === 200,
        });

        errorRate.add(!deleteSuccess);
        if (deleteSuccess) successCount.add(1);
    }
}

function testSustainedInvoiceOperations() {
    // Create customer first
    const customerData = generateCustomer();
    const customerResponse = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), {
        headers,
        timeout: '10s'
    });

    if (customerResponse.status === 201) {
        const customerId = JSON.parse(customerResponse.body).customer.id;

        // Create invoice
        const invoiceData = generateInvoice(customerId);
        const createResponse = http.post(`${BASE_URL}/api/invoices`, JSON.stringify(invoiceData), {
            headers,
            timeout: '15s'
        });

        const createSuccess = check(createResponse, {
            'invoice creation status is 201': (r) => r.status === 201,
            'invoice creation response time < 3s': (r) => r.timings.duration < 3000,
        });

        errorRate.add(!createSuccess);
        responseTime.add(createResponse.timings.duration);
        if (createSuccess) successCount.add(1);

        if (createSuccess && createResponse.status === 201) {
            const invoiceId = JSON.parse(createResponse.body).invoice.id;

            // Perform multiple operations on the invoice
            const operations = [
                () => http.get(`${BASE_URL}/api/invoices/${invoiceId}`, { headers }),
                () => http.put(`${BASE_URL}/api/invoices/${invoiceId}`, JSON.stringify({ description: `Updated ${invoiceData.description}` }), { headers }),
                () => http.post(`${BASE_URL}/api/invoices/${invoiceId}/send`, null, { headers }),
                () => http.get(`${BASE_URL}/api/invoices`, { headers }),
            ];

            operations.forEach(operation => {
                const response = operation();
                const success = check(response, {
                    'invoice operation status is 200': (r) => r.status === 200,
                    'invoice operation response time < 2s': (r) => r.timings.duration < 2000,
                });

                errorRate.add(!success);
                responseTime.add(response.timings.duration);
                if (success) successCount.add(1);
            });

            // Cleanup
            const deleteResponse = http.del(`${BASE_URL}/api/invoices/${invoiceId}`, null, { headers });
            const deleteSuccess = check(deleteResponse, {
                'invoice deletion status is 200': (r) => r.status === 200,
            });

            errorRate.add(!deleteSuccess);
            if (deleteSuccess) successCount.add(1);
        }

        // Cleanup customer
        http.del(`${BASE_URL}/api/customers/${customerId}`, null, { headers });
    }
}

function testSustainedBillOperations() {
    // Create vendor first
    const vendorData = generateCustomer(); // Reuse customer generator
    const vendorResponse = http.post(`${BASE_URL}/api/vendors`, JSON.stringify(vendorData), {
        headers,
        timeout: '10s'
    });

    if (vendorResponse.status === 201) {
        const vendorId = JSON.parse(vendorResponse.body).vendor.id;

        // Create bill
        const billData = generateBill(vendorId);
        const createResponse = http.post(`${BASE_URL}/api/bills`, JSON.stringify(billData), {
            headers,
            timeout: '15s'
        });

        const createSuccess = check(createResponse, {
            'bill creation status is 201': (r) => r.status === 201,
            'bill creation response time < 3s': (r) => r.timings.duration < 3000,
        });

        errorRate.add(!createSuccess);
        responseTime.add(createResponse.timings.duration);
        if (createSuccess) successCount.add(1);

        if (createSuccess && createResponse.status === 201) {
            const billId = JSON.parse(createResponse.body).bill.id;

            // Perform multiple operations on the bill
            const operations = [
                () => http.get(`${BASE_URL}/api/bills/${billId}`, { headers }),
                () => http.put(`${BASE_URL}/api/bills/${billId}`, JSON.stringify({ description: `Updated ${billData.description}` }), { headers }),
                () => http.post(`${BASE_URL}/api/bills/${billId}/approve`, null, { headers }),
                () => http.get(`${BASE_URL}/api/bills`, { headers }),
            ];

            operations.forEach(operation => {
                const response = operation();
                const success = check(response, {
                    'bill operation status is 200': (r) => r.status === 200,
                    'bill operation response time < 2s': (r) => r.timings.duration < 2000,
                });

                errorRate.add(!success);
                responseTime.add(response.timings.duration);
                if (success) successCount.add(1);
            });

            // Cleanup
            const deleteResponse = http.del(`${BASE_URL}/api/bills/${billId}`, null, { headers });
            const deleteSuccess = check(deleteResponse, {
                'bill deletion status is 200': (r) => r.status === 200,
            });

            errorRate.add(!deleteSuccess);
            if (deleteSuccess) successCount.add(1);
        }

        // Cleanup vendor
        http.del(`${BASE_URL}/api/vendors/${vendorId}`, null, { headers });
    }
}

function testSustainedPaymentOperations() {
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

            // Create payment
            const paymentData = generatePayment(invoiceId, null);
            const createResponse = http.post(`${BASE_URL}/api/payments`, JSON.stringify(paymentData), {
                headers,
                timeout: '15s'
            });

            const createSuccess = check(createResponse, {
                'payment creation status is 201': (r) => r.status === 201,
                'payment creation response time < 3s': (r) => r.timings.duration < 3000,
            });

            errorRate.add(!createSuccess);
            responseTime.add(createResponse.timings.duration);
            if (createSuccess) successCount.add(1);

            if (createSuccess && createResponse.status === 201) {
                const paymentId = JSON.parse(createResponse.body).payment.id;

                // Perform multiple operations on the payment
                const operations = [
                    () => http.get(`${BASE_URL}/api/payments/${paymentId}`, { headers }),
                    () => http.put(`${BASE_URL}/api/payments/${paymentId}`, JSON.stringify({ description: `Updated ${paymentData.description}` }), { headers }),
                    () => http.get(`${BASE_URL}/api/payments`, { headers }),
                ];

                operations.forEach(operation => {
                    const response = operation();
                    const success = check(response, {
                        'payment operation status is 200': (r) => r.status === 200,
                        'payment operation response time < 2s': (r) => r.timings.duration < 2000,
                    });

                    errorRate.add(!success);
                    responseTime.add(response.timings.duration);
                    if (success) successCount.add(1);
                });

                // Cleanup
                const deleteResponse = http.del(`${BASE_URL}/api/payments/${paymentId}`, null, { headers });
                const deleteSuccess = check(deleteResponse, {
                    'payment deletion status is 200': (r) => r.status === 200,
                });

                errorRate.add(!deleteSuccess);
                if (deleteSuccess) successCount.add(1);
            }

            // Cleanup invoice
            http.del(`${BASE_URL}/api/invoices/${invoiceId}`, null, { headers });
        }

        // Cleanup customer
        http.del(`${BASE_URL}/api/customers/${customerId}`, null, { headers });
    }
}

function testSustainedReportingOperations() {
    // Test various reporting endpoints
    const endpoints = [
        '/api/reports/dashboard',
        '/api/reports/trial-balance',
        '/api/reports/balance-sheet',
        '/api/reports/profit-loss',
        '/api/reports/cash-flow',
    ];

    // Select random subset of endpoints
    const selectedEndpoints = endpoints.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

    selectedEndpoints.forEach(endpoint => {
        const response = http.get(`${BASE_URL}${endpoint}`, {
            headers,
            timeout: '20s'
        });

        const success = check(response, {
            [`${endpoint} status is 200`]: (r) => r.status === 200,
            [`${endpoint} response time < 5s`]: (r) => r.timings.duration < 5000,
        });

        errorRate.add(!success);
        responseTime.add(response.timings.duration);
        if (success) successCount.add(1);
    });
}

function testSustainedMixedOperations() {
    // Perform a mix of different operations
    const operations = [
        () => testSustainedCustomerOperations(),
        () => testSustainedInvoiceOperations(),
        () => testSustainedBillOperations(),
        () => testSustainedPaymentOperations(),
        () => testSustainedReportingOperations(),
    ];

    // Select random subset of operations
    const selectedOperations = operations.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

    selectedOperations.forEach(operation => {
        operation();
    });
}

// Setup and teardown
export function setup() {
    console.log('Starting K6 endurance tests...');
    console.log('This test will run for approximately 2 hours to test system stability');
    return { startTime: new Date().toISOString() };
}

export function teardown(data) {
    console.log(`Endurance tests completed at ${new Date().toISOString()}`);
    console.log(`Test started at: ${data.startTime}`);
    console.log('Check the metrics above for system stability over time');
}
