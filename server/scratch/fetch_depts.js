const url = 'http://localhost:5000/api/dept/departments';

fetch(url)
.then(res => res.json())
.then(data => {
  console.log('✅ DEPARTMENTS FROM API:');
  console.log(data);
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
