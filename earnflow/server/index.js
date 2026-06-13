const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const fs = require('fs');

// Servir archivos estáticos del frontend (React build)
app.use(express.static(path.join(__dirname, '../dist')));

// Conexión a SQLite
let dbPath;
if (process.env.VERCEL) {
  // En Vercel, el sistema de archivos es de solo lectura excepto /tmp
  dbPath = path.join('/tmp', 'earnflow.db');
  const sourceDbPath = path.resolve(__dirname, 'earnflow.db');
  if (!fs.existsSync(dbPath)) {
    try {
      if (fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, dbPath);
        console.log('Base de datos inicial copiada a /tmp.');
      } else {
        console.log('No se encontró base de datos inicial, se creará una nueva en /tmp.');
      }
    } catch (err) {
      console.error('Error al copiar la base de datos a /tmp:', err.message);
    }
  }
} else {
  dbPath = path.resolve(__dirname, 'earnflow.db');
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error al conectar con SQLite:', err.message);
  else console.log(`Conectado a la base de datos SQLite en: ${dbPath}`);
});

// Inicializar tablas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    is_admin INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    balance REAL,
    tasks_today INTEGER,
    pending_approval REAL,
    total_completed INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    reward TEXT,
    time TEXT,
    difficulty TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    amount TEXT,
    date TEXT,
    status TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan_name TEXT,
    amount REAL,
    daily_return REAL,
    duration_days INTEGER,
    days_passed INTEGER,
    status TEXT,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Migración: agregar columna referrer_id si no existe
  db.run(`ALTER TABLE users ADD COLUMN referrer_id INTEGER`, (err) => {
    // Ignorar error si la columna ya existe
  });

  // Migración: agregar columna is_admin si no existe
  db.run(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`, (err) => {
    // Ignorar error si la columna ya existe
  });

  // Migración: agregar columna avatar si no existe
  db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`, (err) => {
    // Ignorar error si la columna ya existe
  });

  // Insertar administrador por defecto si no existe
  db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password, full_name, is_admin) VALUES ('admin', 'admin123', 'Administrador', 1)", function(err2) {
        if (!err2) {
          const adminId = this.lastID;
          db.run("INSERT INTO user_stats (user_id, balance, tasks_today, pending_approval, total_completed) VALUES (?, 0, 0, 0, 0)", [adminId]);
        }
      });
    }
  });

  // Insertar tareas iniciales si no hay
  db.get("SELECT count(*) as count FROM tasks", (err, row) => {
    if (row.count === 0) {
      const tasks = [
        ['Ver Video Publicitario', '$0.50', '30s', 'Fácil'],
        ['Completar Encuesta Rápida', '$1.20', '2min', 'Media'],
        ['Seguir en Redes Sociales', '$0.30', '1min', 'Fácil'],
        ['Probar App Nueva', '$2.50', '5min', 'Media']
      ];
      tasks.forEach(t => {
        db.run("INSERT INTO tasks (title, reward, time, difficulty) VALUES (?, ?, ?, ?)", t);
      });
    }
  });
});

// Endpoints de Autenticación
app.post('/api/register', (req, res) => {
  const { username, password, full_name, referrer } = req.body;

  const doRegister = (referrerId) => {
    db.run("INSERT INTO users (username, password, full_name, referrer_id) VALUES (?, ?, ?, ?)",
      [username, password, full_name, referrerId || null], function(err) {
        if (err) return res.status(400).json({ error: 'El usuario ya existe' });
        
        const userId = this.lastID;
        db.run("INSERT INTO user_stats (user_id, balance, tasks_today, pending_approval, total_completed) VALUES (?, 0, 0, 0, 0)", [userId], () => {
          // Si hay referidor, darle bono de $1.00
          if (referrerId) {
            const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            db.run("UPDATE user_stats SET balance = balance + 1.00 WHERE user_id = ?", [referrerId], () => {
              db.run("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, 'Bono de Referido', '+1.00', ?, 'Completado')",
                [referrerId, date], () => {
                  res.json({ success: true, userId });
                });
            });
          } else {
            res.json({ success: true, userId });
          }
        });
      });
  };

  if (referrer) {
    db.get("SELECT id FROM users WHERE username = ?", [referrer], (err, row) => {
      doRegister(row ? row.id : null);
    });
  } else {
    doRegister(null);
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Credenciales inválidas' });
    res.json({ success: true, user });
  });
});

// ── Endpoints de Avatar ────────────────────────────────────────────────
app.get('/api/avatar/:userId', (req, res) => {
  db.get("SELECT avatar FROM users WHERE id = ?", [req.params.userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ avatar: row.avatar || null });
  });
});

app.post('/api/avatar', (req, res) => {
  const { userId, avatar } = req.body;
  if (!userId || !avatar) return res.status(400).json({ error: 'userId y avatar son requeridos' });
  db.run("UPDATE users SET avatar = ? WHERE id = ?", [avatar, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  });
});

app.get('/api/stats/:userId', (req, res) => {
  db.get("SELECT * FROM user_stats WHERE user_id = ?", [req.params.userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      // Check if user exists in users table
      db.get("SELECT id FROM users WHERE id = ?", [req.params.userId], (err2, userRow) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (userRow) {
          // User exists but has no user_stats row yet (initialize it)
          db.run("INSERT INTO user_stats (user_id, balance, tasks_today, pending_approval, total_completed) VALUES (?, 0, 0, 0, 0)", [req.params.userId], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json({ user_id: parseInt(req.params.userId), balance: 0, tasks_today: 0, pending_approval: 0, total_completed: 0 });
          });
        } else {
          // User does not exist at all (stale session)
          res.status(404).json({ error: 'User not found' });
        }
      });
    } else {
      res.json(row);
    }
  });
});

app.get('/api/tasks', (req, res) => {
  db.all("SELECT * FROM tasks", (err, rows) => {
    res.json(rows || []);
  });
});

app.get('/api/transactions/:userId', (req, res) => {
  db.all("SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 10", [req.params.userId], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/deposit', (req, res) => {
  const { userId, method, amount, reference } = req.body;
  const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const amountStr = `+${parseFloat(amount).toFixed(2)}`;
  
  db.run("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, ?)", 
    [userId, `Depósito ${method}`, amountStr, date, 'Pendiente'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run("UPDATE user_stats SET pending_approval = pending_approval + ? WHERE user_id = ?", [parseFloat(amount), userId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true, transactionId: this.lastID });
      });
  });
});

app.post('/api/withdraw', (req, res) => {
  const { userId, method, amount, destination } = req.body;
  const amt = parseFloat(amount);

  db.get("SELECT balance FROM user_stats WHERE user_id = ?", [userId], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Usuario no encontrado' });
    if (row.balance < amt) return res.status(400).json({ error: 'Saldo insuficiente para realizar el retiro' });
    if (amt < 5) return res.status(400).json({ error: 'El monto mínimo de retiro es $5.00 USD' });

    db.run("UPDATE user_stats SET balance = balance - ? WHERE user_id = ?", [amt, userId], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      const amountStr = `-${amt.toFixed(2)}`;
      db.run("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, 'Pendiente')",
        [userId, `Retiro ${method}`, amountStr, date], function(err3) {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({ success: true });
        });
    });
  });
});

app.post('/api/complete-task', (req, res) => {
  const { userId, reward } = req.body;
  const rewardNum = parseFloat(reward.replace('$', ''));
  
  db.run("UPDATE user_stats SET balance = balance + ?, tasks_today = tasks_today + 1, total_completed = total_completed + 1 WHERE user_id = ?", [rewardNum, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    if (this.changes === 0) {
      // User stats row was not updated. Let's check if the user exists in users table.
      db.get("SELECT id FROM users WHERE id = ?", [userId], (err2, userRow) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (userRow) {
          // Initialize stats row with the reward
          db.run("INSERT INTO user_stats (user_id, balance, tasks_today, pending_approval, total_completed) VALUES (?, ?, 1, 0, 1)", [userId, rewardNum], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json({ success: true });
          });
        } else {
          // User does not exist at all
          res.status(404).json({ error: 'User not found' });
        }
      });
    } else {
      res.json({ success: true });
    }
  });
});

app.get('/api/investments/:userId', (req, res) => {
  db.all("SELECT * FROM investments WHERE user_id = ? ORDER BY id DESC", [req.params.userId], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/investments', (req, res) => {
  const { userId, planName, amount, dailyReturn, durationDays } = req.body;
  const amt = parseFloat(amount);
  
  db.get("SELECT balance FROM user_stats WHERE user_id = ?", [userId], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Usuario no encontrado' });
    if (row.balance < amt) return res.status(400).json({ error: 'Saldo insuficiente' });
    
    db.run("UPDATE user_stats SET balance = balance - ? WHERE user_id = ?", [amt, userId], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      
      db.run("INSERT INTO investments (user_id, plan_name, amount, daily_return, duration_days, days_passed, status, created_at) VALUES (?, ?, ?, ?, ?, 0, 'Activo', ?)",
        [userId, planName, amt, parseFloat(dailyReturn), parseInt(durationDays), date], function(err3) {
          if (err3) return res.status(500).json({ error: err3.message });
          
          const amountStr = `-${amt.toFixed(2)}`;
          db.run("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, 'Completado')",
            [userId, `Inversión Plan ${planName}`, amountStr, date], (err4) => {
              if (err4) return res.status(500).json({ error: err4.message });
              res.json({ success: true });
            });
        });
    });
  });
});

app.post('/api/investments/claim-day', (req, res) => {
  const { investmentId } = req.body;
  db.get("SELECT * FROM investments WHERE id = ?", [investmentId], (err, inv) => {
    if (err || !inv) return res.status(404).json({ error: 'Inversión no encontrada' });
    if (inv.status === 'Finalizado') return res.status(400).json({ error: 'La inversión ya ha finalizado' });
    
    const nextDaysPassed = inv.days_passed + 1;
    const dailyProfit = (inv.amount * inv.daily_return) / 100;
    
    if (nextDaysPassed >= inv.duration_days) {
      db.run("UPDATE investments SET days_passed = ?, status = 'Finalizado' WHERE id = ?", [inv.duration_days, investmentId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        
        const totalPayout = inv.amount + dailyProfit;
        db.run("UPDATE user_stats SET balance = balance + ? WHERE user_id = ?", [totalPayout, inv.user_id], (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });
          
          const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
          db.run("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, 'Completado')",
            [inv.user_id, `Finalización Plan ${inv.plan_name}`, `+${totalPayout.toFixed(2)}`, date], (err4) => {
              res.json({ success: true, finished: true, profit: totalPayout });
            });
        });
      });
    } else {
      db.run("UPDATE investments SET days_passed = ? WHERE id = ?", [nextDaysPassed, investmentId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        
        db.run("UPDATE user_stats SET balance = balance + ? WHERE user_id = ?", [dailyProfit, inv.user_id], (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });
          
          const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
          db.run("INSERT INTO transactions (user_id, type, amount, date, status) VALUES (?, ?, ?, ?, 'Completado')",
            [inv.user_id, `Retorno Diario Plan ${inv.plan_name}`, `+${dailyProfit.toFixed(2)}`, date], (err4) => {
              res.json({ success: true, finished: false, profit: dailyProfit });
            });
        });
      });
    }
  });
});

app.get('/api/referrals/:userId', (req, res) => {
  db.all("SELECT u.username, u.full_name, u.id as referred_id FROM users u WHERE u.referrer_id = ?",
    [req.params.userId], (err, refs) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(refs || []);
    });
});

// Endpoints de Administración
app.get('/api/admin/transactions', (req, res) => {
  db.all(`
    SELECT t.*, u.username, u.full_name 
    FROM transactions t 
    JOIN users u ON t.user_id = u.id 
    WHERE t.status = 'Pendiente' 
    ORDER BY t.id DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/admin/approve-transaction', (req, res) => {
  const { transactionId } = req.body;
  
  db.get("SELECT * FROM transactions WHERE id = ?", [transactionId], (err, tx) => {
    if (err || !tx) return res.status(404).json({ error: 'Transacción no encontrada' });
    if (tx.status !== 'Pendiente') return res.status(400).json({ error: 'La transacción ya no está pendiente' });
    
    db.serialize(() => {
      db.run("UPDATE transactions SET status = 'Completado' WHERE id = ?", [transactionId], (err1) => {
        if (err1) return res.status(500).json({ error: err1.message });
        
        if (tx.type.startsWith('Depósito')) {
          const amt = parseFloat(tx.amount.replace('+', ''));
          db.run("UPDATE user_stats SET balance = balance + ?, pending_approval = pending_approval - ? WHERE user_id = ?", [amt, amt, tx.user_id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
          });
        } else {
          res.json({ success: true });
        }
      });
    });
  });
});

app.post('/api/admin/reject-transaction', (req, res) => {
  const { transactionId } = req.body;
  
  db.get("SELECT * FROM transactions WHERE id = ?", [transactionId], (err, tx) => {
    if (err || !tx) return res.status(404).json({ error: 'Transacción no encontrada' });
    if (tx.status !== 'Pendiente') return res.status(400).json({ error: 'La transacción ya no está pendiente' });
    
    db.serialize(() => {
      db.run("UPDATE transactions SET status = 'Rechazado' WHERE id = ?", [transactionId], (err1) => {
        if (err1) return res.status(500).json({ error: err1.message });
        
        if (tx.type.startsWith('Depósito')) {
          const amt = parseFloat(tx.amount.replace('+', ''));
          db.run("UPDATE user_stats SET pending_approval = pending_approval - ? WHERE user_id = ?", [amt, tx.user_id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
          });
        } else {
          const amt = Math.abs(parseFloat(tx.amount));
          db.run("UPDATE user_stats SET balance = balance + ? WHERE user_id = ?", [amt, tx.user_id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
          });
        }
      });
    });
  });
});

// Manejo de rutas para SPA
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
