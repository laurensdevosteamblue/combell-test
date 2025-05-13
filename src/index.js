import process from 'process';

process.on('unhandledRejection', err => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});
process.on('uncaughtException', err => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import scoresRouter from './routes/scores.js';

import { pool } from './db.js';  // adjust path if needed

pool.getConnection()
  .then(conn => {
    console.log('✅ DB connection OK');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DB connection FAILED:', err);
    process.exit(1);
  });

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname helper in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.use(bodyParser.json());

// serve static assets
app.use(express.static(path.resolve(__dirname, '../public')));

app.use('/api/scores', scoresRouter);

// matches anything under / but NOT the root "/" itself
app.get('/*splat', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });
  
  // …or, to include the root path "/" as well…
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });

// (your API middleware/routes go here)

console.log(`Starting server:
  NODE_VERSION=${process.version}
  DB_HOST=${process.env.DB_HOST}
  DB_USER=${process.env.DB_USER}
  PORT=${PORT}
`);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
