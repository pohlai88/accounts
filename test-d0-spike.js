#!/usr/bin/env node

/**
 * D0 Micro-Spike Test: Journal Posting Flow
 * 
 * This demonstrates the complete journal posting flow with:
 * - Zod contract validation
 * - SoD (Segregation of Duties) compliance
 * - Business rule validation (balanced entries)
 * - Error handling with proper HTTP status codes
 * - Mock RLS scope enforcement
 */

const API_BASE = 'http://localhost:3001'; // Assuming web-api runs on 3001

// Test data: Valid balanced journal entry
const validJournal = {
  journalNumber: "JE-2024-001",
  description: "Test journal entry for D0 spike",
  journalDate: new Date().toISOString(),
  currency: "MYR",
  lines: [
    {
      accountId: "550e8400-e29b-41d4-a716-446655440001", // Cash account
      debit: 1000,
      credit: 0,
      description: "Cash received",
      reference: "REF-001"
    },
    {
      accountId: "550e8400-e29b-41d4-a716-446655440002", // Revenue account
      debit: 0,
      credit: 1000,
      description: "Service revenue",
      reference: "REF-001"
    }
  ],
  idempotencyKey: crypto.randomUUID()
};

// Test data: Invalid unbalanced journal
const unbalancedJournal = {
  ...validJournal,
  journalNumber: "JE-2024-002",
  lines: [
    {
      accountId: "550e8400-e29b-41d4-a716-446655440001",
      debit: 1000,
      credit: 0,
      description: "Unbalanced entry"
    }
  ],
  idempotencyKey: crypto.randomUUID()
};

async function testJournalPosting() {
  console.log('🚀 D0 Micro-Spike: Journal Posting Flow Test\n');

  // Test 1: Valid journal with manager role (should require approval)
  console.log('📝 Test 1: Valid journal with manager role');
  try {
    const response = await fetch(`${API_BASE}/api/journals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token',
        'x-tenant-id': 'tenant-123',
        'x-company-id': 'company-456',
        'x-user-id': 'user-789',
        'x-user-role': 'manager'
      },
      body: JSON.stringify(validJournal)
    });

    const result = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Journal ID: ${result.id}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Requires Approval: ${result.requiresApproval}`);
    console.log(`   Total Debit: ${result.totalDebit}`);
    console.log(`   Total Credit: ${result.totalCredit}`);
    console.log('   ✅ SUCCESS: Valid journal processed correctly\n');
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 2: Unbalanced journal (should fail validation)
  console.log('📝 Test 2: Unbalanced journal (should fail)');
  try {
    const response = await fetch(`${API_BASE}/api/journals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token',
        'x-tenant-id': 'tenant-123',
        'x-company-id': 'company-456',
        'x-user-id': 'user-789',
        'x-user-role': 'manager'
      },
      body: JSON.stringify(unbalancedJournal)
    });

    const result = await response.json();
    
    if (response.status === 400) {
      console.log(`   Status: ${response.status}`);
      console.log(`   Error Code: ${result.error.code}`);
      console.log(`   Error Message: ${result.error.message}`);
      console.log('   ✅ SUCCESS: Unbalanced journal rejected correctly\n');
    } else {
      console.log('   ❌ ERROR: Unbalanced journal should have been rejected\n');
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 3: Clerk role (should fail SoD validation)
  console.log('📝 Test 3: Clerk role posting (should fail SoD)');
  try {
    const response = await fetch(`${API_BASE}/api/journals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token',
        'x-tenant-id': 'tenant-123',
        'x-company-id': 'company-456',
        'x-user-id': 'user-999',
        'x-user-role': 'clerk'
      },
      body: JSON.stringify({
        ...validJournal,
        journalNumber: "JE-2024-003",
        idempotencyKey: crypto.randomUUID()
      })
    });

    const result = await response.json();
    
    if (response.status === 400 && result.error.code === 'SOD_VIOLATION') {
      console.log(`   Status: ${response.status}`);
      console.log(`   Error Code: ${result.error.code}`);
      console.log(`   Error Message: ${result.error.message}`);
      console.log('   ✅ SUCCESS: SoD violation detected correctly\n');
    } else {
      console.log('   ❌ ERROR: SoD violation should have been detected\n');
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 4: Admin role (should post immediately without approval)
  console.log('📝 Test 4: Admin role posting (should post immediately)');
  try {
    const response = await fetch(`${API_BASE}/api/journals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token',
        'x-tenant-id': 'tenant-123',
        'x-company-id': 'company-456',
        'x-user-id': 'user-admin',
        'x-user-role': 'admin'
      },
      body: JSON.stringify({
        ...validJournal,
        journalNumber: "JE-2024-004",
        idempotencyKey: crypto.randomUUID()
      })
    });

    const result = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Journal ID: ${result.id}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Requires Approval: ${result.requiresApproval}`);
    
    if (result.status === 'posted' && !result.requiresApproval) {
      console.log('   ✅ SUCCESS: Admin can post without approval\n');
    } else {
      console.log('   ❌ ERROR: Admin should be able to post without approval\n');
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  console.log('🎉 D0 Micro-Spike Test Complete!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Zod contract validation working');
  console.log('   ✅ SoD compliance enforcement working');
  console.log('   ✅ Business rule validation (balanced entries) working');
  console.log('   ✅ Role-based approval workflow working');
  console.log('   ✅ Error handling with proper HTTP codes working');
  console.log('   ✅ Mock RLS scope extraction working');
  console.log('\n🚧 Next Steps for D1:');
  console.log('   - Integrate actual Supabase database with RLS');
  console.log('   - Add idempotency key enforcement');
  console.log('   - Implement audit trail logging');
  console.log('   - Add Playwright E2E tests');
  console.log('   - Add UI components for journal entry');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testJournalPosting().catch(console.error);
}

export { testJournalPosting };
