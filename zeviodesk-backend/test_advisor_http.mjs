// Test: Login as advisor and fetch tickets
import https from 'https';
import http from 'http';

async function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    };
    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(resData) });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function get(url, cookie) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Cookie': cookie,
      }
    };
    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(resData) });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Login as advisor
  console.log('1. Logging in as advisor...');
  const loginRes = await post('http://localhost:3001/api/auth/login', {
    email: 'sanumol@gmail.com',
    password: 'vAAAN@123'  // We'll need the actual password
  });
  
  console.log('Login status:', loginRes.status);
  console.log('Login body:', JSON.stringify(loginRes.body, null, 2));
  
  // Extract cookie
  const setCookieHeader = loginRes.headers['set-cookie'];
  if (!setCookieHeader) {
    console.log('No cookie set - login failed');
    return;
  }
  
  const cookie = setCookieHeader[0].split(';')[0];
  console.log('Cookie:', cookie.substring(0, 50) + '...');
  
  // Fetch tickets
  console.log('\n2. Fetching tickets as advisor...');
  const ticketsRes = await get(
    'http://localhost:3001/api/tickets?statusIn=RECEIVED%2CDIAGNOSING%2CWAITING_FOR_PARTS%2CIN_PROGRESS%2CREADY_FOR_PICKUP',
    cookie
  );
  
  console.log('Tickets status:', ticketsRes.status);
  console.log('Tickets body:', JSON.stringify(ticketsRes.body, null, 2));
  
  // Also test without statusIn
  console.log('\n3. Fetching tickets WITHOUT statusIn...');
  const ticketsRes2 = await get('http://localhost:3001/api/tickets', cookie);
  console.log('Tickets (no statusIn) status:', ticketsRes2.status);
  console.log('Tickets (no statusIn) body:', JSON.stringify(ticketsRes2.body, null, 2));
}

main().catch(console.error);
