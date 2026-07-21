const http = require('http');

function postCheck(body) {
  const data = JSON.stringify(body);
  const opts = {
    hostname: '127.0.0.1',
    port: process.env.PORT || 3000,
    path: '/check',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(opts, res => {
    let out = '';
    res.on('data', c => out += c);
    res.on('end', () => {
      console.log('status', res.statusCode);
      console.log('body', out);
    });
  });

  req.on('error', err => console.error('request error', err));
  req.write(data);
  req.end();
}

// Example: make several requests to show per-user + per-endpoint checks
postCheck({ clientId: 'alice', endpoint: '/search' });
postCheck({ clientId: 'alice', endpoint: '/profile/update' });
postCheck({ ip: '1.2.3.4', endpoint: '/search' });
