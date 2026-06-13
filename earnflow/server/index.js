const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (React build)
app.use(express.static(path.join(__dirname, '../dist')));

// ── Database Layer (sql.js - WebAssembly SQLite) ───────────────────────
let db = null;
let initPromise = null;

function saveToTmp() {
  if (process.env.VERCEL && db) {
    try {
      const data = db.export();
      fs.writeFileSync('/tmp/earnflow.db', Buffer.from(data));
    } catch (e) {
      console.error('Error al guardar DB en /tmp:', e.message);
    }
  }
}

function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function dbRun(sql, params = []) {
  db.run(sql, params);
}

function lastInsertId() {
  const result = db.exec("SELECT last_insert_rowid() as id");
  return result[0].values[0][0];
}

function getRowsModified() {
  return db.getRowsModified();
}

async function ensureDb() {
  if (db) return;
  if (!initPromise) {
    initPromise = (async () => {
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();

      let buffer = null;
      const tmpPath = '/tmp/earnflow.db';
      const localPath = path.resolve(__dirname, 'earnflow.db');

      if (process.env.VERCEL && fs.existsSync(tmpPath)) {
        buffer = fs.readFileSync(tmpPath);
        console.log('DB cargada desde /tmp');
      } else if (fs.existsSync(localPath)) {
        buffer = fs.readFileSync(localPath);
        console.log('DB cargada desde archivo local');
      }

      db = buffer ? new SQL.Database(new Uint8Array(buffer)) : new SQL.Database();
      console.log('Base de datos SQLite (sql.js) inicializada');

      // Crear tablas
      dbRun(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        full_name TEXT,
        is_admin INTEGER DEFAULT 0,
        referrer_id INTEGER,
        avatar TEXT
      )`);

      dbRun(`CREATE TABLE IF NOT EXISTS user_stats (
        user_id INTEGER PRIMARY KEY,
        balance REAL DEFAULT 0,
        tasks_today INTEGER DEFAULT 0,
        pending_approval REAL DEFAULT 0,
        total_completed INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      dbRun(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        reward TEXT,
        time TEXT,
        difficulty TEXT
      )`);

      dbRun(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount TEXT,
        date TEXT,
        status TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      dbRun(`CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        plan_name TEXT,
        amount REAL,
        daily_return REAL,
        duration_days INTEGER,
        days_passed INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Activo',
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Migración: agregar columnas si se carga una DB antigua
      try { dbRun(`ALTER TABLE users ADD COLUMN referrer_id INTEGER`); } catch(e) {}
      try { dbRun(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`); } catch(e) {}
      try { dbRun(`ALTER TABLE users ADD COLUMN avatar TEXT`); } catch(e) {}

      // Insertar administrador por defecto si no existe
      const admin = dbGet("SELECT * FROM users WHERE username = 'admin'");
      if (!admin) {
        dbRun("INSERT INTO users (username, password, full_name, is_admin) VALUES ('admin', 'admin123', 'Administrador', 1)");
        const adminId = lastInsertId();
        dbRun("INSERT INTO user_stats (user_id, balance, tasks_today, pending_approval, total_completed) VALUES (?, 0, 0, 0, 0)", [adminId]);
      }

      // Insertar tareas iniciales si no hay
      const taskCount = dbGet("SELECT count(*) as count FROM tasks");
      if (taskCount && taskCount.count === 0) {
        const tasks = [
          ['Ver Video Publicitario', '$0.50', '30s', 'Fácil'],
          ['Completar Encuesta Rápida', '$1.20', '2min', 'Media'],
          ['Seguir en Redes Sociales', '$0.30', '1min', 'Fácil'],
          ['Probar App Nueva', '$2.50', '5min', 'Media']
        ];
        tasks.forEach(t => {
          dbRun("INSERT INTO tasks (title, reward, time, difficulty) VALUES (?, ?, ?, ?)", t);
        });
      }

      saveToTmp();
    })();
  }
  await initPromise;
}

// Middleware para asegurar que la DB está lista
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
    res.status(500).json({ error: 'Error al inicializar la base de datos: ' + err.message });
  }
});

// ── Endpoints de Autenticación ─────────────────────────────────────────
app.post('/api/register', (req, res) => {
  try {
    const { username, password, full_name, referrer } = req.body;

    let referrerId = null;
    if (referrer) {
      const ref = dbGet("SELECT id FROM users WHERE username = ?", [referrer]);
      if (ref) referrerId = ref.id;
    }

    try {
      dbRun("INSERT INTO users (username, password, full_name, referrer_id) VALUES (?, ?, ?, ?)",
        [username, password, full_name, referrerId || null]);
    } catch (e) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const userId = lastInsertId();
    dbRun("INSERT INTO user_stats (user_id, balance, tasks_today, pending_approval, total_completed) VALUES (?, 0, 0, 0, 0)", [userId]);

    if (referrerId) {
      const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      dbRun("UPDATE user_stats SET balance = balance + 1.00 WHERE user_id = ?", [referrerId]);
      dbRun("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, 'Bono de Referido', '+1.00', ?, 'Completado')",
        [referrerId, date]);
    }

    saveToTmp();
    res.json({ success: true, userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = dbGet("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Endpoints de Avatar ────────────────────────────────────────────────
app.get('/api/avatar/:userId', (req, res) => {
  try {
    const row = dbGet("SELECT avatar FROM users WHERE id = ?", [Number(req.params.userId)]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ avatar: row.avatar || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/avatar', (req, res) => {
  try {
    const { userId, avatar } = req.body;
    if (!userId || !avatar) return res.status(400).json({ error: 'userId y avatar son requeridos' });
    dbRun("UPDATE users SET avatar = ? WHERE id = ?", [avatar, Number(userId)]);
    if (getRowsModified() === 0) return res.status(404).json({ error: 'User not found' });
    saveToTmp();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Endpoints de Stats ─────────────────────────────────────────────────
app.get('/api/stats/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const row = dbGet("SELECT * FROM user_stats WHERE user_id = ?", [userId]);
    if (!row) {
      const userRow = dbGet("SELECT id FROM users WHERE id = ?", [userId]);
      if (userRow) {
        dbRun("INSERT INTO user_stats (user_id, balance, tasks_today, pending_approval, total_completed) VALUES (?, 0, 0, 0, 0)", [userId]);
        saveToTmp();
        res.json({ user_id: userId, balance: 0, tasks_today: 0, pending_approval: 0, total_completed: 0 });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } else {
      res.json(row);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks', (req, res) => {
  try {
    const rows = dbAll("SELECT * FROM tasks");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions/:userId', (req, res) => {
  try {
    const rows = dbAll("SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 10", [Number(req.params.userId)]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/deposit', (req, res) => {
  try {
    const { userId, method, amount, reference } = req.body;
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const amountStr = `+${parseFloat(amount).toFixed(2)}`;

    dbRun("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, ?)",
      [Number(userId), `Depósito ${method}`, amountStr, date, 'Pendiente']);
    const transactionId = lastInsertId();

    dbRun("UPDATE user_stats SET pending_approval = pending_approval + ? WHERE user_id = ?", [parseFloat(amount), Number(userId)]);

    saveToTmp();
    res.json({ success: true, transactionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/withdraw', (req, res) => {
  try {
    const { userId, method, amount, destination } = req.body;
    const amt = parseFloat(amount);

    const row = dbGet("SELECT balance FROM user_stats WHERE user_id = ?", [Number(userId)]);
    if (!row) return res.status(500).json({ error: 'Usuario no encontrado' });
    if (row.balance < amt) return res.status(400).json({ error: 'Saldo insuficiente para realizar el retiro' });
    if (amt < 5) return res.status(400).json({ error: 'El monto mínimo de retiro es $5.00 USD' });

    dbRun("UPDATE user_stats SET balance = balance - ? WHERE user_id = ?", [amt, Number(userId)]);

    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const amountStr = `-${amt.toFixed(2)}`;
    dbRun("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, 'Pendiente')",
      [Number(userId), `Retiro ${method}`, amountStr, date]);

    saveToTmp();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/complete-task', (req, res) => {
  try {
    const { userId, reward } = req.body;
    const rewardNum = parseFloat(reward.replace('$', ''));

    dbRun("UPDATE user_stats SET balance = balance + ?, tasks_today = tasks_today + 1, total_completed = total_completed + 1 WHERE user_id = ?",
      [rewardNum, Number(userId)]);

    if (getRowsModified() === 0) {
      const userRow = dbGet("SELECT id FROM users WHERE id = ?", [Number(userId)]);
      if (userRow) {
        dbRun("INSERT INTO user_stats (user_id, balance, tasks_today, pending_approval, total_completed) VALUES (?, ?, 1, 0, 1)",
          [Number(userId), rewardNum]);
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    saveToTmp();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Endpoints de Inversiones ───────────────────────────────────────────
app.get('/api/investments/:userId', (req, res) => {
  try {
    const rows = dbAll("SELECT * FROM investments WHERE user_id = ? ORDER BY id DESC", [Number(req.params.userId)]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/investments', (req, res) => {
  try {
    const { userId, planName, amount, dailyReturn, durationDays } = req.body;
    const amt = parseFloat(amount);

    const row = dbGet("SELECT balance FROM user_stats WHERE user_id = ?", [Number(userId)]);
    if (!row) return res.status(500).json({ error: 'Usuario no encontrado' });
    if (row.balance < amt) return res.status(400).json({ error: 'Saldo insuficiente' });

    dbRun("UPDATE user_stats SET balance = balance - ? WHERE user_id = ?", [amt, Number(userId)]);

    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    dbRun("INSERT INTO investments (user_id, plan_name, amount, daily_return, duration_days, days_passed, status, created_at) VALUES (?, ?, ?, ?, ?, 0, 'Activo', ?)",
      [Number(userId), planName, amt, parseFloat(dailyReturn), parseInt(durationDays), date]);

    const amountStr = `-${amt.toFixed(2)}`;
    dbRun("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, 'Completado')",
      [Number(userId), `Inversión Plan ${planName}`, amountStr, date]);

    saveToTmp();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/investments/claim-day', (req, res) => {
  try {
    const { investmentId } = req.body;
    const inv = dbGet("SELECT * FROM investments WHERE id = ?", [Number(investmentId)]);
    if (!inv) return res.status(404).json({ error: 'Inversión no encontrada' });
    if (inv.status === 'Finalizado') return res.status(400).json({ error: 'La inversión ya ha finalizado' });

    const nextDaysPassed = inv.days_passed + 1;
    const dailyProfit = (inv.amount * inv.daily_return) / 100;
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    if (nextDaysPassed >= inv.duration_days) {
      dbRun("UPDATE investments SET days_passed = ?, status = 'Finalizado' WHERE id = ?", [inv.duration_days, Number(investmentId)]);
      const totalPayout = inv.amount + dailyProfit;
      dbRun("UPDATE user_stats SET balance = balance + ? WHERE user_id = ?", [totalPayout, inv.user_id]);
      dbRun("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, 'Completado')",
        [inv.user_id, `Finalización Plan ${inv.plan_name}`, `+${totalPayout.toFixed(2)}`, date]);
      saveToTmp();
      res.json({ success: true, finished: true, profit: totalPayout });
    } else {
      dbRun("UPDATE investments SET days_passed = ? WHERE id = ?", [nextDaysPassed, Number(investmentId)]);
      dbRun("UPDATE user_stats SET balance = balance + ? WHERE user_id = ?", [dailyProfit, inv.user_id]);
      dbRun("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, 'Completado')",
        [inv.user_id, `Retorno Diario Plan ${inv.plan_name}`, `+${dailyProfit.toFixed(2)}`, date]);
      saveToTmp();
      res.json({ success: true, finished: false, profit: dailyProfit });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Endpoints de Referidos ─────────────────────────────────────────────
app.get('/api/referrals/:userId', (req, res) => {
  try {
    const refs = dbAll("SELECT u.username, u.full_name, u.id as referred_id FROM users u WHERE u.referrer_id = ?",
      [Number(req.params.userId)]);
    res.json(refs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Endpoints de Administración ────────────────────────────────────────
app.get('/api/admin/transactions', (req, res) => {
  try {
    const rows = dbAll(`
      SELECT t.*, u.username, u.full_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'Pendiente'
      ORDER BY t.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/approve-transaction', (req, res) => {
  try {
    const { transactionId } = req.body;
    const tx = dbGet("SELECT * FROM transactions WHERE id = ?", [Number(transactionId)]);
    if (!tx) return res.status(404).json({ error: 'Transacción no encontrada' });
    if (tx.status !== 'Pendiente') return res.status(400).json({ error: 'La transacción ya no está pendiente' });

    dbRun("UPDATE transactions SET status = 'Completado' WHERE id = ?", [Number(transactionId)]);

    if (String(tx.type).startsWith('Depósito')) {
      const amt = parseFloat(String(tx.amount).replace('+', ''));
      dbRun("UPDATE user_stats SET balance = balance + ?, pending_approval = pending_approval - ? WHERE user_id = ?", [amt, amt, tx.user_id]);
    }

    saveToTmp();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/reject-transaction', (req, res) => {
  try {
    const { transactionId } = req.body;
    const tx = dbGet("SELECT * FROM transactions WHERE id = ?", [Number(transactionId)]);
    if (!tx) return res.status(404).json({ error: 'Transacción no encontrada' });
    if (tx.status !== 'Pendiente') return res.status(400).json({ error: 'La transacción ya no está pendiente' });

    dbRun("UPDATE transactions SET status = 'Rechazado' WHERE id = ?", [Number(transactionId)]);

    if (String(tx.type).startsWith('Depósito')) {
      const amt = parseFloat(String(tx.amount).replace('+', ''));
      dbRun("UPDATE user_stats SET pending_approval = pending_approval - ? WHERE user_id = ?", [amt, tx.user_id]);
    } else {
      const amt = Math.abs(parseFloat(String(tx.amount)));
      dbRun("UPDATE user_stats SET balance = balance + ? WHERE user_id = ?", [amt, tx.user_id]);
    }

    saveToTmp();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Manejo de rutas para SPA ───────────────────────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor Backend corriendo en el puerto ${port}`);
  });
}

module.exports = app;
