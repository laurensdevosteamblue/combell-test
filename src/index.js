// src/index.js
import process from 'process';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import scoresRouter from './routes/scores.js';
import { pool } from './db.js';

// ─── DEBUG: confirm loaded file ──────────────────────────────────────────────
const __loadedFile = fileURLToPath(import.meta.url);
console.log('🗂  Loaded index.js from', __loadedFile);
console.log('  CWD:', process.cwd());

// ─── Global Error Handlers ───────────────────────────────────────────────────
process.on('unhandledRejection', err => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});
process.on('uncaughtException', err => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// ─── Test DB Connection ───────────────────────────────────────────────────────
pool.getConnection()
  .then(conn => {
    console.log('✅ DB connection OK');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DB connection FAILED:', err);
    process.exit(1);
  });

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// ESM __dirname helper
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Session & Body Parsing ───────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'replace-with-strong-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ─── SIGNUP ───────────────────────────────────────────────────────────────────
// Show signup form
app.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.sendFile(path.resolve(__dirname, '../public/signup.html'));
});

// Process signup
app.post('/signup', async (req, res) => {
  const { username, password, confirm } = req.body;
  // basic validation
  if (!username || !password || password !== confirm) {
    return res.redirect('/signup?error=invalid');
  }
  try {
    // check for existing username
    const [[existing]] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existing) {
      // already taken
      return res.redirect('/signup?error=taken');
    }
    // store new user
    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, NOW())',
      [username, hash]
    );
    return res.redirect('/login?signup=ok');
  } catch (err) {
    console.error('Signup error:', err);
    return res.redirect('/signup?error=server');
  }
});

// ─── LOGIN & LOGOUT ──────────────────────────────────────────────────────────
// Show login form
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.sendFile(path.resolve(__dirname, '../public/login.html'));
});

// Process login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [[user]] = await pool.execute(
      'SELECT id, password_hash FROM users WHERE username = ?',
      [username]
    );
    if (user && await bcrypt.compare(password, user.password_hash)) {
      req.session.user = { id: user.id, username };
      return res.redirect('/');
    }
  } catch (err) {
    console.error('Login error:', err);
  }
  return res.redirect('/login?error=invalid');
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ─── “Who am I?” endpoint ───────────────────────────────────────────────────
app.get('/api/me', (req, res) => {
  if (req.session.user) {
    return res.json({ username: req.session.user.username });
  }
  res.status(401).json({ error: 'Not logged in' });
});

// ─── Auth Middleware ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (
    req.session.user ||
    req.path === '/login' ||
    req.path === '/login.html' ||
    req.path === '/signup' ||
    req.path === '/signup.html' ||
    req.path === '/logout' ||
    req.path.startsWith('/api')
  ) {
    return next();
  }
  res.redirect('/login');
});

// ─── Static Files & API ──────────────────────────────────────────────────────
app.use(express.static(path.resolve(__dirname, '../public')));
app.use('/api/scores', scoresRouter);

// ─── SPA Fallback (use app.use to avoid path-to-regexp) ───────────────────────
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// ─── Start Server ───────────────────────────────────────────────────────────
console.log(`Starting server on port ${PORT}`);
app.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
