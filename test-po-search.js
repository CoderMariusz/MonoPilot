/**
 * Quick test script to verify PO search API fix
 * Tests that search parameter doesn't cause SQL errors
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/planning/purchase-orders';

async function testSearch() {
  console.log('Testing PO search API...\n');
  
  // Test 1: Search with PO number
  console.log('Test 1: Searching for "PO-2026-02153"...');
  const searchUrl = `${API_URL}?search=PO-2026-02153`;
  
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: Search completed without error');
      console.log(`   Status: ${response.status}`);
      console.log(`   Results: ${data.purchase_orders?.length || 0} POs found`);
      console.log(`   Total: ${data.total || 0}`);
    } else {
      console.log('❌ FAILED: API returned error');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
  
  // Test 2: Search with partial number
  console.log('\nTest 2: Searching for "2026"...');
  const partialUrl = `${API_URL}?search=2026`;
  
  try {
    const response = await fetch(partialUrl);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: Partial search completed without error');
      console.log(`   Status: ${response.status}`);
      console.log(`   Results: ${data.purchase_orders?.length || 0} POs found`);
    } else {
      console.log('❌ FAILED: Partial search returned error');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
  
  // Test 3: No search (should work)
  console.log('\nTest 3: Fetching all POs (no search)...');
  
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: Fetch all completed without error');
      console.log(`   Status: ${response.status}`);
      console.log(`   Results: ${data.purchase_orders?.length || 0} POs found`);
    } else {
      console.log('❌ FAILED: Fetch all returned error');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
  
  console.log('\n✅ ALL TESTS PASSED - Search API is working correctly');
  return true;
}

// Run the test
testSearch()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
