const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  const username = `api_test_${Date.now()}`;
  console.log(`Registering user: ${username}`);
  
  const res = await post('/api/register', {
    username: username,
    password: 'password123',
    full_name: 'API Test User'
  });
  console.log('API response:', res);

  // Now inspect the DB file
  const dbPath = path.resolve(__dirname, '../server/earnflow.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to DB:', err);
      process.exit(1);
    }
  });

  db.all("SELECT * FROM users", (err, rows) => {
    if (err) console.error(err);
    console.log('Users in DB file:', rows);
    db.close();
  });
}

run();
