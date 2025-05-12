import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname helper in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// serve static assets
app.use(express.static(path.resolve(__dirname, '../public')));

// matches anything under / but NOT the root "/" itself
app.get('/*splat', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });
  
  // …or, to include the root path "/" as well…
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });

// (your API middleware/routes go here)

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
