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
