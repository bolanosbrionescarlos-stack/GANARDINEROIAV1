const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/earnflow.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  console.log('--- USERS ---');
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) console.error(err);
    console.log(rows);

    console.log('--- USER_STATS ---');
    db.all("SELECT * FROM user_stats", (err2, rows2) => {
      if (err2) console.error(err2);
      console.log(rows2);
      db.close();
    });
  });
});
