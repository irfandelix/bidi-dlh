const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  // Use the ID from the recently created document if possible, but 1 is probably fine to test
  // wait, the error happened for the newly created document. I'll query Supabase to find its ID,
  // or I can just use a dummy ID and see if the template logic crashes
  id: 1, 
  type: 'template_tanda_terima_registrasi',
  stage: 'registrasi'
}));

req.end();
