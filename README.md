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
