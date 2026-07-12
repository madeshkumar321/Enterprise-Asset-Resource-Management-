HEAD
# AssetFlow Starter — Setup Guide (for complete beginners)

Follow these steps in order. Every command goes into the **Terminal** inside VS Code
(open it with `View → Terminal` or `` Ctrl+` ``).

---

## Step 1 — Open this folder in VS Code

- Unzip this folder somewhere easy to find (e.g. Desktop)
- In VS Code: `File → Open Folder` → select the `assetflow-starter` folder

---

## Step 2 — Create the database

Open a terminal and run:

```
psql -U postgres
```

It will ask for the password you set when installing PostgreSQL. Once you're in
(you'll see a prompt like `postgres=#`), run:

```sql
CREATE DATABASE assetflow;
\q
```

That creates an empty database called `assetflow` and then quits.

---

## Step 3 — Load the table structure

Still in the terminal (back in your normal terminal, not inside psql), run:

```
psql -U postgres -d assetflow -f schema.sql
```

This creates all the tables (departments, employees, assets, bookings, etc).
You should see a bunch of `CREATE TABLE` lines print out — that means it worked.

---

## Step 4 — Set up your environment file

1. Find the file `.env.example` in the project
2. Make a copy of it and rename the copy to `.env`
3. Open `.env` and replace `your_postgres_password_here` with your real Postgres password

---

## Step 5 — Install the project's dependencies

In the terminal:

```
npm install
```

This downloads all the libraries the project needs (Express, PostgreSQL driver, etc).
It'll take a minute. You'll see a `node_modules` folder appear — that's normal, don't touch it.

---

## Step 6 — Run the app

```
npm run dev
```

If everything worked, you'll see:

```
AssetFlow running: http://localhost:3000
```

Open that link in your browser. You should see the login page.

---

## Step 7 — Create your first account, then make it Admin

1. Click "Sign up" and create an account — it'll be a plain **Employee** account
2. Every new signup is always "Employee" — nobody can self-assign a role
3. Since there's no Admin yet, we manually promote your first account **once**, directly in the database:

```
psql -U postgres -d assetflow
```

Then inside psql:

```sql
UPDATE employees SET role = 'Admin' WHERE email = 'the_email_you_signed_up_with@example.com';
\q
```

4. Log out and log back in on the website. You should now see "Organization Setup" in the nav bar.
5. From now on, use that Admin account to promote any future teammates to Department Head /
   Asset Manager via the Employee Directory tab — no more manual SQL needed.

---

## What's already built

- Login / Signup (Employee-only signup, no self-role-assignment)
- Dashboard with KPI cards + overdue returns
- Organization Setup (Departments, Categories, Employee Directory + role promotion)
- Asset Registration + searchable Directory
- Asset Allocation with the **double-allocation block** (tries to allocate an already-held
  asset → blocked, offers Transfer Request)
- Transfer request + approval flow
- Return flow (condition notes, asset goes back to Available)
- Resource Booking with **overlap validation** (can't double-book a time slot)

## What's NOT built yet (your job to add, or leave as future work in your pitch)

- Maintenance request workflow (table already exists in schema.sql — routes/views needed)
- Audit cycles (table already exists — routes/views needed)
- Notifications page (table exists — you could just list rows from `notifications`)
- Reports & Analytics page

## How the project is organized

```
server.js          → starts everything, wires routes together
db.js               → the one place that connects to PostgreSQL
middleware.js       → login/role checks used before routes run
schema.sql          → the database structure (run once)
routes/             → one file per feature (auth, dashboard, org, assets)
views/              → the actual HTML pages (EJS templates)
public/style.css    → all the styling
```

**To add a new feature** (e.g. Maintenance), the pattern is always the same:
1. Add a route file in `routes/` (copy the shape of `routes/assets.js`)
2. Add view files in `views/` for the pages
3. Wire the route into `server.js` with `app.use('/maintenance', maintenanceRoutes)`

---

## If something breaks

- **"password authentication failed"** → your `.env` password doesn't match your real Postgres password
- **"database assetflow does not exist"** → re-run Step 2
- **"relation employees does not exist"** → re-run Step 3 (schema.sql didn't load)
- **Page shows an error stack trace** → read the first line, it usually names the exact file/line
=======
AssetFlow

Enterprise Asset & Resource Management System — track, allocate, and maintain shared physical assets and resources without spreadsheets or paper logs.


The Problem

Most organizations — schools, hospitals, factories, offices, agencies — track their equipment, furniture, vehicles, and shared spaces using spreadsheets and paper logs. This leads to constant, avoidable issues:


Two people are assigned the same asset because nobody checked who already has it
Shared resources like meeting rooms or vehicles get double-booked
Maintenance requests get lost or repairs happen without any approval trail
Nobody has real-time visibility into what's available, who holds what, or what's overdue


There's no single source of truth — just scattered logs, memory, and guesswork.

The Solution

AssetFlow is a centralized ERP-style platform that gives organizations one place to manage their entire asset and resource lifecycle. It enforces the rules that spreadsheets can't:


An asset can't be allocated to two people at once — the system blocks it and offers a transfer request instead
A shared resource can't be double-booked — overlapping time slots are automatically rejected
Roles are never self-assigned — every account starts as a plain Employee, and only an Admin can promote someone to Department Head or Asset Manager
Maintenance and audits follow a structured approval workflow instead of ad-hoc emails or verbal requests


The result: real-time visibility into every asset's status, location, and holder, with accountability built into every workflow instead of bolted on afterward.


Key Features


Role-based access control — Admin, Asset Manager, Department Head, and Employee roles, each with different permissions; roles are only assignable by an Admin, never self-selected at signup
Organization setup — manage departments (with optional hierarchy), asset categories, and a central employee directory
Asset lifecycle tracking — every asset moves through defined states: Available → Allocated → Reserved → Under Maintenance → Lost / Retired / Disposed
Conflict-free allocation — attempting to allocate an already-held asset is blocked, shows who currently holds it, and offers a one-click Transfer Request instead
Transfer & return workflow — transfer requests go through an approval step before the asset is reallocated; returns capture condition notes and revert the asset to Available
Resource booking with overlap validation — shared/bookable assets (rooms, vehicles, equipment) can be booked by time slot; overlapping requests are rejected automatically
Real-time KPI dashboard — live counts of available/allocated assets, active bookings, pending transfers, and maintenance today, with overdue returns surfaced separately
Full asset history — every asset retains its complete allocation and maintenance history


Planned / in progress


Maintenance request approval workflow (Pending → Approved → Technician Assigned → Resolved)
Structured audit cycles with auditor assignment and auto-generated discrepancy reports
Notifications feed and full activity log
Reports & analytics (utilization trends, maintenance frequency, booking heatmaps)


(Database schema for all of the above already exists — these are next in line for development.)


Tech Stack

LayerTechnologyBackendNode.js, ExpressFrontendEJS (server-rendered templates)DatabasePostgreSQLAuthexpress-session, bcrypt


Screenshots

(Add screenshots here before submitting — a few strong ones go a long way)

DashboardAsset DirectoryAllocation Blockedscreenshotscreenshotscreenshot

Resource BookingOverlap RejectedOrganization Setupscreenshotscreenshotscreenshot


Demo


Live demo: add deployed link here, if available
Demo video: add a 1–2 minute walkthrough link here



Getting Started

Full setup instructions are in README-SETUP.md, written step by step for anyone setting up a Node/PostgreSQL project for the first time. Short version:

bash# 1. Create the database
psql -U postgres -c "CREATE DATABASE assetflow;"

# 2. Load the schema
psql -U postgres -d assetflow -f schema.sql

# 3. Configure environment
cp .env.example .env   # then fill in your Postgres password

# 4. Install & run
npm install
npm run dev

Then open http://localhost:3000.


First account created via signup is always a plain Employee. See the setup guide for how to promote your first Admin.




Project Structure

server.js          → app entry point, wires everything together
db.js               → PostgreSQL connection
middleware.js       → login/role-based access checks
schema.sql          → full database schema
routes/             → one file per feature (auth, dashboard, org, assets)
views/              → EJS page templates
public/             → static assets (CSS)

