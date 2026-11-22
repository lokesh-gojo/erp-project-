const url = 'http://localhost:5000/api/auth/login';

async function testLogin(identifier, password) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNo: identifier, password: password })
    });
    const data = await res.json();
    console.log(`--- Login with ${identifier} ---`);
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, data);
  } catch (err) {
    console.error(`Error logging in with ${identifier}:`, err);
  }
}

async function run() {
  await testLogin('ns9210', '123');
  await testLogin('admin@nscet.edu', '123');
  process.exit(0);
}

run();
