const express = require('express');
const pool = require('../db');
const { requireLogin, requireRole } = require('../middleware');
const router = express.Router();

// ---- Asset Directory (everyone can view) ----
router.get('/', requireLogin, async (req, res) => {
  const { status, category_id, search } = req.query;

  let query = `
    SELECT a.*, c.name AS category_name,
      (SELECT e.name FROM allocations al
       JOIN employees e ON e.id = al.employee_id
       WHERE al.asset_id = a.id AND al.status = 'Active' LIMIT 1) AS current_holder
    FROM assets a
    LEFT JOIN asset_categories c ON c.id = a.category_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    params.push(status);
    query += ` AND a.status = $${params.length}`;
  }
  if (category_id) {
    params.push(category_id);
    query += ` AND a.category_id = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (a.asset_tag ILIKE $${params.length} OR a.name ILIKE $${params.length} OR a.serial_number ILIKE $${params.length})`;
  }
  query += ' ORDER BY a.id DESC';

  const assets = await pool.query(query, params);
  const categories = await pool.query('SELECT * FROM asset_categories ORDER BY name');

  res.render('assets/index', {
    assets: assets.rows,
    categories: categories.rows,
    filters: { status, category_id, search }
  });
});

// ---- Register new asset (Asset Manager / Admin only) ----
router.get('/new', requireRole('Admin', 'AssetManager'), async (req, res) => {
  const categories = await pool.query('SELECT * FROM asset_categories ORDER BY name');
  res.render('assets/new', { categories: categories.rows });
});

router.post('/', requireRole('Admin', 'AssetManager'), async (req, res) => {
  const { name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, is_bookable } = req.body;

  // Auto-generate asset tag like AF-0001
  const countResult = await pool.query('SELECT COUNT(*) FROM assets');
  const nextNumber = parseInt(countResult.rows[0].count, 10) + 1;
  const asset_tag = `AF-${String(nextNumber).padStart(4, '0')}`;

  await pool.query(
    `INSERT INTO assets (asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, is_bookable, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Available')`,
    [asset_tag, name, category_id || null, serial_number, acquisition_date || null,
     acquisition_cost || null, condition || 'Good', location, is_bookable === 'on']
  );

  res.redirect('/assets');
});

// ---- Asset detail page (history) ----
router.get('/:id', requireLogin, async (req, res) => {
  const asset = await pool.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
  if (asset.rows.length === 0) return res.status(404).send('Asset not found');

  const allocationHistory = await pool.query(`
    SELECT al.*, e.name AS employee_name, d.name AS department_name
    FROM allocations al
    LEFT JOIN employees e ON e.id = al.employee_id
    LEFT JOIN departments d ON d.id = al.department_id
    WHERE al.asset_id = $1 ORDER BY al.allocated_at DESC
  `, [req.params.id]);

  const maintenanceHistory = await pool.query(
    'SELECT * FROM maintenance_requests WHERE asset_id = $1 ORDER BY created_at DESC',
    [req.params.id]
  );

  const employees = await pool.query("SELECT id, name FROM employees WHERE status = 'Active' ORDER BY name");

  res.render('assets/detail', {
    asset: asset.rows[0],
    allocationHistory: allocationHistory.rows,
    maintenanceHistory: maintenanceHistory.rows,
    employees: employees.rows,
    error: req.query.error,
    holder: req.query.holder,
    info: req.query.info
  });
});

// ---- Allocate asset (THE CORE CONFLICT RULE) ----
router.post('/:id/allocate', requireRole('Admin', 'AssetManager'), async (req, res) => {
  const { employee_id, expected_return_date } = req.body;
  const assetId = req.params.id;

  // Check for an existing ACTIVE allocation on this asset
  const active = await pool.query(
    `SELECT al.*, e.name AS holder_name FROM allocations al
     JOIN employees e ON e.id = al.employee_id
     WHERE al.asset_id = $1 AND al.status = 'Active'`,
    [assetId]
  );

  if (active.rows.length > 0) {
    // BLOCK the allocation - this is the double-allocation rule from the spec
    return res.redirect(`/assets/${assetId}?error=already_held&holder=${encodeURIComponent(active.rows[0].holder_name)}`);
  }

  await pool.query(
    `INSERT INTO allocations (asset_id, employee_id, allocated_at, expected_return_date, status)
     VALUES ($1, $2, NOW(), $3, 'Active')`,
    [assetId, employee_id, expected_return_date || null]
  );
  await pool.query("UPDATE assets SET status = 'Allocated' WHERE id = $1", [assetId]);

  res.redirect(`/assets/${assetId}`);
});

// ---- Return asset ----
router.post('/:id/return', requireRole('Admin', 'AssetManager'), async (req, res) => {
  const { return_condition_notes } = req.body;
  const assetId = req.params.id;

  await pool.query(
    `UPDATE allocations SET status = 'Returned', returned_at = NOW(), return_condition_notes = $1
     WHERE asset_id = $2 AND status = 'Active'`,
    [return_condition_notes, assetId]
  );
  await pool.query("UPDATE assets SET status = 'Available' WHERE id = $1", [assetId]);

  res.redirect(`/assets/${assetId}`);
});

// ---- Request a transfer (offered when allocation is blocked) ----
router.post('/:id/transfer-request', requireLogin, async (req, res) => {
  const { to_employee_id } = req.body;
  const assetId = req.params.id;

  const active = await pool.query(
    "SELECT employee_id FROM allocations WHERE asset_id = $1 AND status = 'Active'",
    [assetId]
  );
  const fromEmployeeId = active.rows[0] ? active.rows[0].employee_id : null;

  await pool.query(
    `INSERT INTO transfer_requests (asset_id, from_employee_id, to_employee_id, requested_by, status)
     VALUES ($1, $2, $3, $4, 'Requested')`,
    [assetId, fromEmployeeId, to_employee_id, req.session.user.id]
  );

  res.redirect(`/assets/${assetId}?info=transfer_requested`);
});

// ---- Approve a transfer request (Department Head / Asset Manager) ----
router.put('/transfer-requests/:id/approve', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req, res) => {
  const request = await pool.query('SELECT * FROM transfer_requests WHERE id = $1', [req.params.id]);
  const tr = request.rows[0];
  if (!tr) return res.status(404).send('Transfer request not found');

  // Close out the old allocation, open a new one - history stays intact
  await pool.query(
    "UPDATE allocations SET status = 'Returned', returned_at = NOW() WHERE asset_id = $1 AND status = 'Active'",
    [tr.asset_id]
  );
  await pool.query(
    `INSERT INTO allocations (asset_id, employee_id, allocated_at, status)
     VALUES ($1, $2, NOW(), 'Active')`,
    [tr.asset_id, tr.to_employee_id]
  );
  await pool.query(
    "UPDATE transfer_requests SET status = 'Reallocated', resolved_at = NOW() WHERE id = $1",
    [req.params.id]
  );

  res.redirect(`/assets/${tr.asset_id}`);
});

// ============================================================
// BOOKINGS (shared resources, time-slot based, overlap checked)
// ============================================================

router.get('/:id/bookings', requireLogin, async (req, res) => {
  const asset = await pool.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
  const bookings = await pool.query(`
    SELECT b.*, e.name AS booked_by_name FROM bookings b
    JOIN employees e ON e.id = b.booked_by
    WHERE b.asset_id = $1 AND b.status != 'Cancelled'
    ORDER BY b.start_time
  `, [req.params.id]);

  res.render('assets/bookings', { asset: asset.rows[0], bookings: bookings.rows, error: req.query.error });
});

router.post('/:id/bookings', requireLogin, async (req, res) => {
  const { start_time, end_time } = req.body;
  const assetId = req.params.id;

  // THE OVERLAP RULE:
  // Two bookings overlap if one starts before the other ends, in both directions.
  // existing.start < new.end  AND  existing.end > new.start
  const overlap = await pool.query(
    `SELECT * FROM bookings
     WHERE asset_id = $1
       AND status != 'Cancelled'
       AND start_time < $3
       AND end_time > $2`,
    [assetId, start_time, end_time]
  );

  if (overlap.rows.length > 0) {
    return res.redirect(`/assets/${assetId}/bookings?error=overlap`);
  }

  await pool.query(
    `INSERT INTO bookings (asset_id, booked_by, start_time, end_time, status)
     VALUES ($1, $2, $3, $4, 'Upcoming')`,
    [assetId, req.session.user.id, start_time, end_time]
  );

  res.redirect(`/assets/${assetId}/bookings`);
});

router.put('/bookings/:id/cancel', requireLogin, async (req, res) => {
  const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
  await pool.query("UPDATE bookings SET status = 'Cancelled' WHERE id = $1", [req.params.id]);
  res.redirect(`/assets/${booking.rows[0].asset_id}/bookings`);
});

module.exports = router;
