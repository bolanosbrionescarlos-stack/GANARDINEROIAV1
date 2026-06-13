const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('Tasks:', await get('/api/tasks'));
    for (let id = 1; id <= 10; id++) {
      const stats = await get(`/api/stats/${id}`);
      if (Object.keys(stats).length > 0) {
        console.log(`User ID ${id} stats:`, stats);
      }
    }
  } catch (e) {
    console.error('Error querying backend:', e);
  }
}

run();
