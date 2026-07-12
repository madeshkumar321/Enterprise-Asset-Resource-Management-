const express = require('express');
const pool = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();

router.get('/', requireLogin, async (req, res) => {
  // Each of these is a small independent count - easy to read, easy to extend
  const available = await pool.query("SELECT COUNT(*) FROM assets WHERE status = 'Available'");
  const allocated = await pool.query("SELECT COUNT(*) FROM assets WHERE status = 'Allocated'");
  const underMaintenance = await pool.query("SELECT COUNT(*) FROM assets WHERE status = 'Under Maintenance'");
  const activeBookings = await pool.query("SELECT COUNT(*) FROM bookings WHERE status IN ('Upcoming','Ongoing')");
  const pendingTransfers = await pool.query("SELECT COUNT(*) FROM transfer_requests WHERE status = 'Requested'");

  const overdue = await pool.query(`
    SELECT a.id, a.asset_tag, a.name, al.expected_return_date, e.name AS holder_name
    FROM allocations al
    JOIN assets a ON a.id = al.asset_id
    LEFT JOIN employees e ON e.id = al.employee_id
    WHERE al.status = 'Active'
      AND al.expected_return_date IS NOT NULL
      AND al.expected_return_date < CURRENT_DATE
  `);

  res.render('dashboard', {
    kpis: {
      available: available.rows[0].count,
      allocated: allocated.rows[0].count,
      underMaintenance: underMaintenance.rows[0].count,
      activeBookings: activeBookings.rows[0].count,
      pendingTransfers: pendingTransfers.rows[0].count,
    },
    overdue: overdue.rows
  });
});

module.exports = router;
