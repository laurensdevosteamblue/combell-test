import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import scoresRouter from './routes/scores.js';

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname helper in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 1️⃣ Parse JSON bodies
app.use(express.json());

// 2️⃣ Serve static assets
app.use(express.static(path.resolve(__dirname, '../public')));

// 3️⃣ Mount your scores API
app.use('/api/scores', scoresRouter);

// 4️⃣ SPA fallback (matches “/” and any nested path)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
