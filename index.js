const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database
const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS pois (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'approved'
    );
  `;
  try {
    await pool.query(queryText);
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database', err);
  }
};
initDb();

app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/api/poi', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pois WHERE status = 'approved' ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/poi', async (req, res) => {
  const { name, category, latitude, longitude, address } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO pois (name, category, latitude, longitude, address, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category, latitude, longitude, address, 'approved']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Trucker Buddy server running on port ${port}`);
});
