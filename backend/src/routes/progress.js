const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get user's game progress
router.get('/games', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.name, g.url_path, up.high_score, up.times_played, up.last_played
       FROM user_progress up
       JOIN games g ON up.game_id = g.id
       WHERE up.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update game progress
router.post('/games/:gameId', auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { score } = req.body;

    // First, check if game exists
    const gameExists = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameExists.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update or insert progress
    const result = await pool.query(
      `INSERT INTO user_progress (user_id, game_id, high_score, times_played, last_played)
       VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, game_id) DO UPDATE
       SET high_score = GREATEST(user_progress.high_score, $3),
           times_played = user_progress.times_played + 1,
           last_played = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, gameId, score]
    );

    // Update user points
    await pool.query(
      'UPDATE users SET points = points + $1 WHERE id = $2',
      [score, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's achievements
router.get('/achievements', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.name, a.description, a.points_reward, ua.earned_at
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT 
        points,
        streak,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1) as achievements_count,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1) as games_played
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );
    res.json(stats.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 