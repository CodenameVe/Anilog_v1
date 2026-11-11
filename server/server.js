const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('AniLog API is running! Go to /api/test');
});

app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ message: 'Connected to anilog_db!', userCount: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ error: 'DB connection failed' });
  }
});

// --- PUBLIC PROFILE: Get user by username ---
app.get('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    // LOWER for case-insensitive
    const result = await pool.query(
      'SELECT id, username, avatar_url, created_at FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get quick stats for profile header
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_logs,
         COALESCE(SUM(episode_end - episode_start + 1), 0) as total_episodes,
         COALESCE(AVG(rating), 0) as avg_rating
       FROM logs WHERE user_id = $1`,
      [user.id]
    );

    res.json({ 
      user,
      stats: statsResult.rows[0]
    });

  } catch (err) {
    console.error('Public profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// --- PUBLIC PROFILE: Get user's logs ---
app.get('/api/users/:username/logs', async (req, res) => {
  const { username } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    const logsResult = await pool.query(
      'SELECT * FROM logs WHERE user_id = $1 ORDER BY watched_on DESC, created_at DESC',
      [userId]
    );

    res.json(logsResult.rows);

  } catch (err) {
    console.error('Public logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});


// --- NEW: SIGNUP ---
app.post('/api/signup', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username required' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }

  // Strong password criteria - must match frontend
  const passwordErrors = [];
  if (password.length < 8) passwordErrors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) passwordErrors.push("1 uppercase letter");
  if (!/[a-z]/.test(password)) passwordErrors.push("1 lowercase letter");
  if (!/[0-9]/.test(password)) passwordErrors.push("1 number");
  if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push("1 special character (!@#$...)");

  if (passwordErrors.length > 0) {
    return res.status(400).json({ error: `Password must have: ${passwordErrors.join(", ")}` });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1 OR username=$2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
      [email, username, password_hash]
    );

    const newUser = result.rows[0];
    
    // NEW: create token so user is auto-logged in after signup
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: newUser });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// --- NEW: LOGIN ---
app.post('/api/login', async (req, res) => {
  const { email, password, username, identifier } = req.body;
  // allow frontend to send either {email} or {username} or {identifier}
  const loginValue = identifier || email || username;
  if (!loginValue || !password) {
    return res.status(400).json({ error: 'Username/email and password required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 OR username=$1',
      [loginValue]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, username: user.username, avatar_url: user.avatar_url } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});


// --- GET ALL LOGS FOR LOGGED IN USER ---
app.get('/api/logs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM logs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});


// --- CREATE A NEW LOG ---
app.post('/api/logs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { anime_title, anime_image, season, episode_start, episode_end, watched_on, rating, thoughts } = req.body;

    if (!anime_title) {
      return res.status(400).json({ error: 'anime_title is required' });
    }

    const result = await pool.query(
      `INSERT INTO logs (user_id, anime_title, anime_image, season, episode_start, episode_end, watched_on, rating, thoughts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, anime_title, anime_image || null, season || null, episode_start || null, episode_end || null, watched_on || new Date(), rating || null, thoughts || null]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('POST /api/logs DB Error:', err.message);
    console.error(err);
    res.status(500).json({ error: 'Failed to create log', detail: err.message });
    }
});


// DELETE : only user can delete
app.delete('/api/logs/:id', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const logId = req.params.id;
  try {
    const result = await pool.query(
      'DELETE FROM logs WHERE id = $1 AND user_id = $2 RETURNING *',
      [logId, userId]
    );
    if (result.rows.length === 0) {
      // No row deleted = either doesn't exist or not owned by this user
      return res.status(404).json({ error: 'Log not found or not yours' });
    }
    res.json({ message: 'Deleted', deletedLog: result.rows[0] });
  } catch (err) {
    console.error('DELETE /api/logs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE a log - only owner can edit rating & thoughts
app.put('/api/logs/:id', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const logId = req.params.id;
  const { rating, thoughts, episode_start, episode_end } = req.body;

  try {
    const result = await pool.query(
      `UPDATE logs 
       SET rating = COALESCE($1, rating), 
           thoughts = COALESCE($2, thoughts),
           episode_start = COALESCE($3, episode_start),
           episode_end = COALESCE($4, episode_end)
       WHERE id = $5 AND user_id = $6 
       RETURNING *`,
      [rating, thoughts, episode_start, episode_end, logId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found or not yours' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('PUT /api/logs error:', err);
    res.status(500).json({ error: 'Failed to update log' });
  }
});

// --- UPDATE MY AVATAR (protected) ---
app.put('/api/users/me/avatar', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { avatar_url } = req.body;
  if (!avatar_url) {
    return res.status(400).json({ error: 'avatar_url required' });
  }
  // Basic URL validation
  if (!avatar_url.startsWith('http')) {
    return res.status(400).json({ error: 'Must be a valid image URL' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, avatar_url, created_at',
      [avatar_url, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Avatar update error:', err);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});