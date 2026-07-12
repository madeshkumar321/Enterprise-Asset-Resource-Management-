const express = require('express');
const pool = require('../db');
const { requireRole } = require('../middleware');
const router = express.Router();

// Only Admin can access anything under /org
router.use(requireRole('Admin'));

// ---- Main org setup page (3 tabs handled client-side with query param) ----
router.get('/', async (req, res) => {
  const departments = await pool.query(`
    SELECT d.*, e.name AS head_name
    FROM departments d
    LEFT JOIN employees e ON e.id = d.head_employee_id
    ORDER BY d.id
  `);
  const categories = await pool.query('SELECT * FROM asset_categories ORDER BY id');
  const employees = await pool.query(`
    SELECT emp.*, d.name AS department_name
    FROM employees emp
    LEFT JOIN departments d ON d.id = emp.department_id
    ORDER BY emp.id
  `);

  res.render('org', {
    tab: req.query.tab || 'departments',
    departments: departments.rows,
    categories: categories.rows,
    employees: employees.rows
  });
});

// ---- Departments ----
router.post('/departments', async (req, res) => {
  const { name, parent_department_id, head_employee_id } = req.body;
  await pool.query(
    `INSERT INTO departments (name, parent_department_id, head_employee_id, status)
     VALUES ($1, $2, $3, 'Active')`,
    [name, parent_department_id || null, head_employee_id || null]
  );
  res.redirect('/org?tab=departments');
});

router.put('/departments/:id/status', async (req, res) => {
  const { status } = req.body; // Active / Inactive
  await pool.query('UPDATE departments SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.redirect('/org?tab=departments');
});

// ---- Asset Categories ----
router.post('/categories', async (req, res) => {
  const { name } = req.body;
  await pool.query('INSERT INTO asset_categories (name) VALUES ($1)', [name]);
  res.redirect('/org?tab=categories');
});

// ---- Employee Directory: role promotion (the ONLY place roles are assigned) ----
router.put('/employees/:id/role', async (req, res) => {
  const { role, department_id } = req.body; // Employee / DepartmentHead / AssetManager / Admin
  await pool.query(
    'UPDATE employees SET role = $1, department_id = $2 WHERE id = $3',
    [role, department_id || null, req.params.id]
  );
  res.redirect('/org?tab=employees');
});

router.put('/employees/:id/status', async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE employees SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.redirect('/org?tab=employees');
});

module.exports = router;
