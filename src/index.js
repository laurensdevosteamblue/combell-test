import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Serve static assets from public/
app.use(express.static(path.resolve(__dirname, '../public')));

// 2. Fallback to index.html for client-side routing (if you add React Router later)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// -- your existing JSON middleware & API routes here --
// app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});