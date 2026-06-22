const API_URL = 'https://api.upjunoo-dev.tech';
const EMAIL = 'dev.admin@upjunoo-dev.tech';
const PASSWORD = 'Upjunoo@Dev2026!';
const partnerId = '71a1aad7-ad23-41ca-a6d0-b904d5953271';

async function login() {
  const res = await fetch(API_URL + '/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const data = await res.json();
  return data.accessToken || data.session?.access_token;
}

async function test() {
  const token = await login();
  console.log('✅ Connecté\n');
  
  // Test Drivers
  console.log('=== DRIVERS ===');
  const driversRes = await fetch(API_URL + '/v1/partners/' + partnerId + '/drivers', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const drivers = await driversRes.json();
  console.log('Status:', drivers.status);
  console.log('Items count:', drivers.items?.length);
  if (drivers.items?.length > 0) {
    const first = drivers.items[0];
    console.log('Keys:', Object.keys(first).join(', '));
    console.log('Has user?:', !!first.user);
    console.log('Has vehicle?:', !!first.vehicle);
    if (first.user) console.log('User:', JSON.stringify(first.user));
    if (first.vehicle) console.log('Vehicle:', JSON.stringify(first.vehicle));
  }
  
  // Test Vehicles
  console.log('\n=== VEHICLES ===');
  const vehRes = await fetch(API_URL + '/v1/partners/' + partnerId + '/vehicles', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const veh = await vehRes.json();
  console.log('Status:', veh.status);
  console.log('Items count:', veh.items?.length);
  if (veh.items?.length > 0) {
    const first = veh.items[0];
    console.log('Keys:', Object.keys(first).join(', '));
    console.log('Has driver?:', !!first.driver);
    if (first.driver) console.log('Driver:', JSON.stringify(first.driver));
  }
  
  // Test Shifts endpoint
  console.log('\n=== SHIFTS ===');
  const shiftsRes = await fetch(API_URL + '/v1/partners/' + partnerId + '/shifts', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('Shifts HTTP:', shiftsRes.status);
  
  // Test Freight Offers
  console.log('\n=== FREIGHT OFFERS ===');
  const freightRes = await fetch(API_URL + '/v1/partners/' + partnerId + '/freight-offers', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const freight = await freightRes.json();
  console.log('Freight HTTP:', freightRes.status, 'Items:', freight.items?.length ?? 'N/A');
  
  // Test Rental Offers
  console.log('\n=== RENTAL OFFERS ===');
  const rentalRes = await fetch(API_URL + '/v1/partners/' + partnerId + '/rental-offers', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const rental = await rentalRes.json();
  console.log('Rental HTTP:', rentalRes.status, 'Items:', rental.items?.length ?? 'N/A');
}

test().catch(console.error);
