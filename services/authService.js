const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const tokenSecret = process.env.JWT_SECRET || 'changeme';
const tokenExpiry = process.env.JWT_EXPIRES_IN || '8h';

const normalizeUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  first_name: row.first_name,
  last_name: row.last_name,
  role: row.role,
  created_at: row.created_at,
});

exports.registerUser = async ({ username, email, password, first_name, last_name, role = 'viewer' }) => {
  if (!username || !email || !password || !first_name || !last_name) {
    const error = new Error('Missing required registration fields');
    error.status = 400;
    throw error;
  }

  const [checkRows] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (checkRows.length > 0) {
    const error = new Error('Username or email already exists');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
    [username, email, passwordHash, first_name, last_name, role]
  );

  const [rows] = await pool.query('SELECT id, username, email, first_name, last_name, role, created_at FROM users WHERE id = ?', [result.insertId]);
  return normalizeUser(rows[0]);
};

exports.loginUser = async (username, password) => {
  if (!username || !password) {
    const error = new Error('Username and password are required');
    error.status = 400;
    throw error;
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length === 0) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const accessToken = jwt.sign({ id: user.id, role: user.role, username: user.username }, tokenSecret, {
    expiresIn: tokenExpiry,
  });

  return {
    access_token: accessToken,
    user: normalizeUser(user),
  };
};

exports.getUserById = async (id) => {
  const [rows] = await pool.query('SELECT id, username, email, first_name, last_name, role, created_at FROM users WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return normalizeUser(rows[0]);
};
