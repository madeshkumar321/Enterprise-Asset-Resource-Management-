const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();

// ---- Signup ----
router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM employees WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.render('signup', { error: 'An account with that email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Signup ALWAYS creates a plain "Employee" - no role selection here.
    // Admin must promote someone via /org later.
    const result = await pool.query(
      `INSERT INTO employees (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'Employee', 'Active') RETURNING id, name, email, role`,
      [name, email, password_hash]
    );

    req.session.user = result.rows[0];
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('signup', { error: 'Something went wrong. Please try again.' });
  }
});

// ---- Login ----
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM employees WHERE email = $1', [email]);
    const employee = result.rows[0];

    if (!employee) {
      return res.render('login', { error: 'No account found with that email.' });
    }

    const match = await bcrypt.compare(password, employee.password_hash);
    if (!match) {
      return res.render('login', { error: 'Incorrect password.' });
    }

    req.session.user = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department_id: employee.department_id
    };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});

// ---- Logout ----
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
