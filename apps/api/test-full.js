// Full integration test: frontend serving + API login
const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('=== ERP Integration Tests ===\n');

  // Test 1: Frontend serving
  console.log('1. Testing frontend serving at http://localhost:3000/');
  try {
    const r1 = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    const hasLogin = r1.body.includes('auth-screen') && r1.body.includes('l-email');
    console.log(`   Status: ${r1.status} | Has login form: ${hasLogin} | Content-Type: ${r1.headers['content-type']}`);
    console.log(`   ${hasLogin ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (e) { console.log(`   ❌ FAIL: ${e.message}\n`); }

  // Test 2: Health check
  console.log('2. Testing API health at /api/v1/health');
  try {
    const r2 = await request({ hostname: 'localhost', port: 3000, path: '/api/v1/health', method: 'GET' });
    const data2 = JSON.parse(r2.body);
    console.log(`   Status: ${r2.status} | Response: ${JSON.stringify(data2)}`);
    console.log(`   ${data2.success ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (e) { console.log(`   ❌ FAIL: ${e.message}\n`); }

  // Test 3: Login with valid credentials
  console.log('3. Testing login with admin@erp.com / admin123');
  try {
    const body3 = JSON.stringify({ email: 'admin@erp.com', password: 'admin123' });
    const r3 = await request({
      hostname: 'localhost', port: 3000, path: '/api/v1/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body3) }
    }, body3);
    const data3 = JSON.parse(r3.body);
    const hasTokens = data3.data?.accessToken && data3.data?.refreshToken;
    const hasUser = data3.data?.user?.email === 'admin@erp.com';
    console.log(`   Status: ${r3.status} | Has tokens: ${!!hasTokens} | User email: ${data3.data?.user?.email}`);
    console.log(`   Roles: ${JSON.stringify(data3.data?.user?.roles)} | Permissions: ${data3.data?.user?.permissions?.length} items`);
    console.log(`   ${data3.success && hasTokens && hasUser ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (e) { console.log(`   ❌ FAIL: ${e.message}\n`); }

  // Test 4: Login with wrong password
  console.log('4. Testing login with wrong password');
  try {
    const body4 = JSON.stringify({ email: 'admin@erp.com', password: 'wrongpassword' });
    const r4 = await request({
      hostname: 'localhost', port: 3000, path: '/api/v1/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body4) }
    }, body4);
    const data4 = JSON.parse(r4.body);
    console.log(`   Status: ${r4.status} | Error: ${data4.error?.message}`);
    console.log(`   ${r4.status === 401 ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (e) { console.log(`   ❌ FAIL: ${e.message}\n`); }

  // Test 5: Register new user
  console.log('5. Testing register new user');
  try {
    const body5 = JSON.stringify({ email: 'test@erp.com', password: 'test12345', fullName: 'Test User', division: 'Sales', role: 'sales' });
    const r5 = await request({
      hostname: 'localhost', port: 3000, path: '/api/v1/auth/register', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body5) }
    }, body5);
    const data5 = JSON.parse(r5.body);
    console.log(`   Status: ${r5.status} | Success: ${data5.success} | Message: ${data5.data?.message}`);
    console.log(`   User: ${data5.data?.user?.email} | Roles: ${JSON.stringify(data5.data?.user?.roles)}`);
    console.log(`   ${data5.success ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (e) { console.log(`   ❌ FAIL: ${e.message}\n`); }

  // Test 6: Login with newly registered user
  console.log('6. Testing login with newly registered user');
  try {
    const body6 = JSON.stringify({ email: 'test@erp.com', password: 'test12345' });
    const r6 = await request({
      hostname: 'localhost', port: 3000, path: '/api/v1/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body6) }
    }, body6);
    const data6 = JSON.parse(r6.body);
    console.log(`   Status: ${r6.status} | Success: ${data6.success} | Email: ${data6.data?.user?.email}`);
    console.log(`   ${data6.success ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (e) { console.log(`   ❌ FAIL: ${e.message}\n`); }

  // Test 7: CORS headers
  console.log('7. Testing CORS headers');
  try {
    const r7 = await request({
      hostname: 'localhost', port: 3000, path: '/api/v1/health', method: 'OPTIONS',
      headers: { 'Origin': 'http://example.com', 'Access-Control-Request-Method': 'POST' }
    });
    const corsHeader = r7.headers['access-control-allow-origin'];
    console.log(`   Status: ${r7.status} | CORS Allow-Origin: ${corsHeader}`);
    console.log(`   ${corsHeader ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (e) { console.log(`   ❌ FAIL: ${e.message}\n`); }

  // Test 8: SPA fallback (non-API routes serve erp.html)
  console.log('8. Testing SPA fallback for /dashboard');
  try {
    const r8 = await request({ hostname: 'localhost', port: 3000, path: '/dashboard', method: 'GET' });
    const hasLogin = r8.body.includes('auth-screen');
    console.log(`   Status: ${r8.status} | Serves erp.html: ${hasLogin}`);
    console.log(`   ${r8.status === 200 && hasLogin ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (e) { console.log(`   ❌ FAIL: ${e.message}\n`); }

  console.log('=== Tests Complete ===');
}

runTests().catch(console.error);
