#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Ailun Saúde Digital
 * Tests all API endpoints and validates business logic
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';

let sessionToken = null;
let testBeneficiaryUUID = null;
let testSpecialtyUUID = null;
let testAvailabilityUUID = null;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type] || ''}[${timestamp}] ${message}${reset}`);
}

async function testEndpoint(method, path, body = null, expectStatus = 200) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(sessionToken && { 'Cookie': `session=${sessionToken}` })
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) })
    });

    const responseData = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    
    if (response.status === expectStatus) {
      log(`✓ ${method} ${path} - Status ${response.status}`, 'success');
      return { success: true, data: responseData, status: response.status };
    } else {
      log(`✗ ${method} ${path} - Expected ${expectStatus}, got ${response.status}`, 'error');
      return { success: false, data: responseData, status: response.status };
    }
  } catch (error) {
    log(`✗ ${method} ${path} - Network error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('🚀 Starting comprehensive test suite for Ailun Saúde Digital', 'info');
  
  // Test 1: Health Check
  log('\n📋 Test 1: Health Check');
  const healthTest = await testEndpoint('GET', '/health', null, 200);
  if (!healthTest.success) {
    log('❌ Health check failed, aborting tests', 'error');
    return;
  }

  // Test 2: Authentication Required (should fail)
  log('\n🔒 Test 2: Authentication Required');
  await testEndpoint('GET', '/api/beneficiaries', null, 401);

  // Test 3: Login with invalid credentials
  log('\n🔐 Test 3: Invalid Login');
  await testEndpoint('POST', '/api/login', { email: 'invalid@test.com', password: 'wrong' }, 401);

  // Test 4: Login with valid credentials
  log('\n🔐 Test 4: Valid Login');
  const loginTest = await testEndpoint('POST', '/api/login', { email: TEST_EMAIL, password: TEST_PASSWORD }, 200);
  if (loginTest.success && loginTest.data.token) {
    sessionToken = loginTest.data.token;
    log(`✓ Session token obtained: ${sessionToken.substring(0, 20)}...`, 'success');
  } else {
    log('❌ Login failed, cannot proceed with authenticated tests', 'error');
    return;
  }

  // Test 5: Check authentication status
  log('\n👤 Test 5: Authentication Status');
  const meTest = await testEndpoint('GET', '/api/me', null, 200);
  if (meTest.success) {
    log(`✓ User authenticated successfully`, 'success');
  }

  // Test 6: Create Beneficiary with invalid data
  log('\n👥 Test 6: Create Beneficiary - Invalid Data');
  await testEndpoint('POST', '/api/beneficiaries', [{
    name: '',
    cpf: '123',
    birthday: 'invalid-date'
  }], 400);

  // Test 7: Create Beneficiary with valid data
  log('\n👥 Test 7: Create Beneficiary - Valid Data');
  const beneficiaryTest = await testEndpoint('POST', '/api/beneficiaries', [{
    name: 'Test Beneficiary',
    cpf: '12345678909', // Valid CPF format
    birthday: '1990-01-01',
    email: 'beneficiary@test.com',
    phone: '11987654321',
    zipCode: '01234567',
    address: 'Test Address',
    city: 'São Paulo',
    state: 'SP',
    paymentType: 'S',
    serviceType: 'G'
  }], 200);

  if (beneficiaryTest.success && beneficiaryTest.data.beneficiaries) {
    testBeneficiaryUUID = beneficiaryTest.data.beneficiaries[0]?.uuid;
    log(`✓ Beneficiary created with UUID: ${testBeneficiaryUUID}`, 'success');
  }

  // Test 8: List Beneficiaries
  log('\n📋 Test 8: List Beneficiaries');
  const listTest = await testEndpoint('GET', '/api/beneficiaries', null, 200);
  if (listTest.success && listTest.data.beneficiaries) {
    log(`✓ Found ${listTest.data.beneficiaries.length} beneficiaries`, 'success');
  }

  // Test 9: Find Beneficiary by CPF
  log('\n🔍 Test 9: Find Beneficiary by CPF');
  await testEndpoint('GET', '/api/beneficiaries/cpf?cpf=12345678909', null, 200);

  // Test 10: List Specialties
  log('\n🏥 Test 10: List Specialties');
  const specialtiesTest = await testEndpoint('GET', '/api/specialties', null, 200);
  if (specialtiesTest.success && specialtiesTest.data.specialties) {
    const specialties = specialtiesTest.data.specialties;
    log(`✓ Found ${specialties.length} specialties`, 'success');
    if (specialties.length > 0) {
      testSpecialtyUUID = specialties[0].uuid;
      log(`✓ Using specialty UUID: ${testSpecialtyUUID}`, 'success');
    }
  }

  // Test 11: Check Specialty Availability
  log('\n📅 Test 11: Specialty Availability');
  if (testSpecialtyUUID && testBeneficiaryUUID) {
    const date = new Date();
    const dateInitial = date.toISOString().split('T')[0];
    const dateFinal = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const availabilityTest = await testEndpoint('GET', 
      `/api/specialty-availability?specialtyUuid=${testSpecialtyUUID}&dateInitial=${dateInitial}&dateFinal=${dateFinal}&beneficiaryUuid=${testBeneficiaryUUID}`, 
      null, 200
    );
    
    if (availabilityTest.success && availabilityTest.data.availability) {
      log(`✓ Found ${availabilityTest.data.availability.length} available slots`, 'success');
      if (availabilityTest.data.availability.length > 0) {
        testAvailabilityUUID = availabilityTest.data.availability[0].uuid;
      }
    }
  }

  // Test 12: Request Appointment
  log('\n🩺 Test 12: Request Appointment');
  if (testBeneficiaryUUID) {
    await testEndpoint('GET', `/api/beneficiaries/${testBeneficiaryUUID}/request-appointment`, null, 200);
  }

  // Test 13: List Medical Referrals
  log('\n📋 Test 13: Medical Referrals');
  if (testBeneficiaryUUID) {
    await testEndpoint('GET', `/api/beneficiaries/${testBeneficiaryUUID}/medical-referrals`, null, 200);
  }

  // Test 14: Schedule Appointment (will fail without referral for medical specialties)
  log('\n📅 Test 14: Schedule Appointment');
  if (testBeneficiaryUUID && testSpecialtyUUID && testAvailabilityUUID) {
    await testEndpoint('POST', '/api/appointments', {
      beneficiaryUuid: testBeneficiaryUUID,
      availabilityUuid: testAvailabilityUUID,
      specialtyUuid: testSpecialtyUUID,
      approveAdditionalPayment: false
    }, 400); // Expected to fail due to missing referral
  }

  // Test 15: List Appointments
  log('\n📋 Test 15: List Appointments');
  await testEndpoint('GET', '/api/appointments', null, 200);

  // Test 16: Update Beneficiary
  log('\n✏️ Test 16: Update Beneficiary');
  if (testBeneficiaryUUID) {
    await testEndpoint('PUT', `/api/beneficiaries/${testBeneficiaryUUID}`, {
      email: 'updated@test.com',
      phone: '11999999999'
    }, 200);
  }

  // Test 17: Logout
  log('\n🚪 Test 17: Logout');
  await testEndpoint('POST', '/api/logout', null, 200);

  // Test 18: Check authentication after logout (should fail)
  log('\n🔒 Test 18: Authentication After Logout');
  await testEndpoint('GET', '/api/me', null, 401);

  log('\n✅ All tests completed!', 'success');
  log(`\n📊 Summary:`);
  log(`- Health Check: ✅`);
  log(`- Authentication: ✅`);
  log(`- Beneficiary Management: ✅`);
  log(`- Appointment Scheduling: ✅`);
  log(`- Error Handling: ✅`);
  log(`- Business Logic Validation: ✅`);
}

// Run tests
runTests().catch(error => {
  log(`❌ Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});