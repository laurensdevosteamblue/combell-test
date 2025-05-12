import { Router } from 'express';
import { pool } from '../db.js';

const router = new Router();

// Get top 10 scores
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT name, score FROM scores ORDER BY score DESC, created_at ASC LIMIT 10'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Post a new score
router.post('/', async (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  try {
    await pool.query(
      'INSERT INTO scores (name, score) VALUES (?, ?)',
      [name, score]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
