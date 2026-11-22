const url1 = 'http://localhost:5000/api/users/add-staff';
const payload1 = {
  name: 'Test Staff Client',
  roll_no: 'CLIENT123',
  email: 'client123@nscet.edu',
  department_id: 1
};

fetch(url1, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload1)
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(result => {
  console.log('--- ADD STAFF RESPONSE ---');
  console.log('Status:', result.status);
  console.log('Data:', JSON.stringify(result.data, null, 2));
})
.catch(err => console.error('Add staff fetch failed:', err))
.then(() => {
  // Test password reset of faculty on ID 15 (which we know exists)
  const url2 = 'http://localhost:5000/api/users/reset-password-admin/15';
  return fetch(url2, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'newpassword123' })
  })
  .then(res => res.json().then(data => ({ status: res.status, data })))
  .then(result => {
    console.log('--- RESET PASSWORD RESPONSE ---');
    console.log('Status:', result.status);
    console.log('Data:', JSON.stringify(result.data, null, 2));
  });
})
.catch(err => console.error('Reset password fetch failed:', err))
.then(() => {
  process.exit(0);
});
