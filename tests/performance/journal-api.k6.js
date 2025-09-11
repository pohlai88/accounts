// V1 k6 Performance Test: Journal API (p95 < 500ms, error rate < 1%)
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// V1 Performance Requirements
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    // V1 Requirements: p95 < 500ms, error rate < 1%
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'], // Less than 1% errors
    journal_creation_time: ['p(95)<500'],
    journal_posting_time: ['p(95)<500'],
  },
}

// Custom metrics
const journalCreationTime = new Trend('journal_creation_time')
const journalPostingTime = new Trend('journal_posting_time')
const errorRate = new Rate('errors')

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'
const API_KEY = __ENV.API_KEY || 'test-api-key'

// Test data
const testTenant = 'test-tenant-perf'
const testCompany = 'test-company-perf'
const testUser = 'test-user-perf'

export function setup() {
  console.log('🚀 Starting V1 Performance Test Setup...')
  
  // Create test tenant and company if needed
  const setupPayload = {
    tenant: {
      id: testTenant,
      name: 'Performance Test Tenant'
    },
    company: {
      id: testCompany,
      tenant_id: testTenant,
      name: 'Performance Test Company',
      currency: 'MYR'
    }
  }
  
  const setupResponse = http.post(`${BASE_URL}/api/test/setup`, JSON.stringify(setupPayload), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  })
  
  check(setupResponse, {
    'setup successful': (r) => r.status === 200 || r.status === 409, // 409 = already exists
  })
  
  return { tenant_id: testTenant, company_id: testCompany }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-Tenant-ID': data.tenant_id,
    'X-Company-ID': data.company_id,
    'X-User-ID': testUser,
  }

  // Test 1: Create Journal Entry (V1 Core Flow)
  const journalPayload = {
    description: `Performance Test Journal ${__VU}-${__ITER}`,
    reference: `PERF-${__VU}-${__ITER}`,
    journal_date: new Date().toISOString().split('T')[0],
    currency: 'MYR',
    lines: [
      {
        account_id: 'acc-cash-perf',
        description: 'Cash received',
        debit: '1000.00',
        credit: '0.00',
        line_order: 1
      },
      {
        account_id: 'acc-revenue-perf',
        description: 'Sales revenue',
        debit: '0.00',
        credit: '1000.00',
        line_order: 2
      }
    ]
  }

  const createStart = Date.now()
  const createResponse = http.post(`${BASE_URL}/api/journals`, JSON.stringify(journalPayload), { headers })
  const createDuration = Date.now() - createStart
  
  journalCreationTime.add(createDuration)
  
  const createSuccess = check(createResponse, {
    'journal creation status is 201': (r) => r.status === 201,
    'journal creation time < 500ms': () => createDuration < 500,
    'response has journal ID': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.id !== undefined
      } catch {
        return false
      }
    },
  })

  if (!createSuccess) {
    errorRate.add(1)
    return
  }

  const journalId = JSON.parse(createResponse.body).id

  // Test 2: Get Journal Entry (Read Performance)
  const getResponse = http.get(`${BASE_URL}/api/journals/${journalId}`, { headers })
  
  check(getResponse, {
    'journal get status is 200': (r) => r.status === 200,
    'journal get time < 200ms': (r) => r.timings.duration < 200,
    'response contains journal data': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.id === journalId && body.lines && body.lines.length === 2
      } catch {
        return false
      }
    },
  })

  // Test 3: Post Journal Entry (V1 Critical Business Logic)
  const postStart = Date.now()
  const postResponse = http.post(`${BASE_URL}/api/journals/${journalId}/post`, '{}', { headers })
  const postDuration = Date.now() - postStart
  
  journalPostingTime.add(postDuration)
  
  const postSuccess = check(postResponse, {
    'journal posting status is 200': (r) => r.status === 200,
    'journal posting time < 500ms': () => postDuration < 500,
    'journal status is posted': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.status === 'posted'
      } catch {
        return false
      }
    },
  })

  if (!postSuccess) {
    errorRate.add(1)
  }

  // Test 4: List Journals (Pagination Performance)
  const listResponse = http.get(`${BASE_URL}/api/journals?limit=20&offset=0`, { headers })
  
  check(listResponse, {
    'journal list status is 200': (r) => r.status === 200,
    'journal list time < 300ms': (r) => r.timings.duration < 300,
    'response contains journals array': (r) => {
      try {
        const body = JSON.parse(r.body)
        return Array.isArray(body.journals)
      } catch {
        return false
      }
    },
  })

  // Test 5: Search Journals (Query Performance)
  const searchResponse = http.get(`${BASE_URL}/api/journals/search?q=Performance Test&limit=10`, { headers })
  
  check(searchResponse, {
    'journal search status is 200': (r) => r.status === 200,
    'journal search time < 400ms': (r) => r.timings.duration < 400,
  })

  // Simulate realistic user behavior
  sleep(1)
}

export function teardown(data) {
  console.log('🧹 Starting V1 Performance Test Teardown...')
  
  // Clean up test data
  const cleanupResponse = http.delete(`${BASE_URL}/api/test/cleanup/${data.tenant_id}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  })
  
  check(cleanupResponse, {
    'cleanup successful': (r) => r.status === 200 || r.status === 404,
  })
  
  console.log('✅ V1 Performance Test Teardown completed')
}
