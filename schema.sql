-- ============================================
-- AssetFlow starter schema
-- Run this once against your "assetflow" database
-- ============================================

-- Departments
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_department_id INTEGER REFERENCES departments(id),
  head_employee_id INTEGER, -- set after employees table exists (see ALTER below)
  status VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active / Inactive
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employees (also serves as the login/user table)
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  role VARCHAR(30) NOT NULL DEFAULT 'Employee', -- Employee / DepartmentHead / AssetManager / Admin
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Now that employees exists, link department head properly
ALTER TABLE departments
  ADD CONSTRAINT fk_head_employee FOREIGN KEY (head_employee_id) REFERENCES employees(id);

-- Asset Categories
CREATE TABLE asset_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  extra_fields JSONB DEFAULT '{}', -- e.g. { "warranty_period_months": 24 }
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assets
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  asset_tag VARCHAR(20) UNIQUE NOT NULL, -- e.g. AF-0001
  name VARCHAR(150) NOT NULL,
  category_id INTEGER REFERENCES asset_categories(id),
  serial_number VARCHAR(100),
  acquisition_date DATE,
  acquisition_cost NUMERIC(12,2),
  condition VARCHAR(50) DEFAULT 'Good',
  location VARCHAR(150),
  is_bookable BOOLEAN DEFAULT FALSE, -- shared/bookable resource flag
  status VARCHAR(30) NOT NULL DEFAULT 'Available',
  -- Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Allocations (current + historical holds of an asset)
CREATE TABLE allocations (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES assets(id) NOT NULL,
  employee_id INTEGER REFERENCES employees(id),
  department_id INTEGER REFERENCES departments(id),
  allocated_at TIMESTAMP DEFAULT NOW(),
  expected_return_date DATE,
  returned_at TIMESTAMP, -- NULL = still held (this is the "active" allocation)
  return_condition_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' -- Active / Returned
);

-- Transfer requests
CREATE TABLE transfer_requests (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES assets(id) NOT NULL,
  from_employee_id INTEGER REFERENCES employees(id),
  to_employee_id INTEGER REFERENCES employees(id) NOT NULL,
  requested_by INTEGER REFERENCES employees(id),
  status VARCHAR(20) NOT NULL DEFAULT 'Requested', -- Requested / Approved / Rejected / Reallocated
  requested_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Bookings (time-slot booking of shared/bookable assets)
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES assets(id) NOT NULL,
  booked_by INTEGER REFERENCES employees(id) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Upcoming', -- Upcoming / Ongoing / Completed / Cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance requests
CREATE TABLE maintenance_requests (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES assets(id) NOT NULL,
  raised_by INTEGER REFERENCES employees(id) NOT NULL,
  issue_description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'Medium', -- Low / Medium / High
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  -- Pending / Approved / Rejected / TechnicianAssigned / InProgress / Resolved
  technician_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Audit cycles
CREATE TABLE audit_cycles (
  id SERIAL PRIMARY KEY,
  scope_department_id INTEGER REFERENCES departments(id),
  scope_location VARCHAR(150),
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Open', -- Open / Closed
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_cycle_auditors (
  audit_cycle_id INTEGER REFERENCES audit_cycles(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id),
  PRIMARY KEY (audit_cycle_id, employee_id)
);

CREATE TABLE audit_items (
  id SERIAL PRIMARY KEY,
  audit_cycle_id INTEGER REFERENCES audit_cycles(id) NOT NULL,
  asset_id INTEGER REFERENCES assets(id) NOT NULL,
  verdict VARCHAR(20), -- Verified / Missing / Damaged
  notes TEXT,
  checked_at TIMESTAMP
);

-- Notifications / activity log
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  message TEXT NOT NULL,
  type VARCHAR(50), -- AssetAssigned, MaintenanceApproved, BookingConfirmed, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful index for overlap/conflict queries
CREATE INDEX idx_bookings_asset_time ON bookings(asset_id, start_time, end_time);
CREATE INDEX idx_allocations_asset_status ON allocations(asset_id, status);
