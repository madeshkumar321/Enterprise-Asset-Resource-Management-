require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const orgRoutes = require('./routes/org');
const assetRoutes = require('./routes/assets');

const app = express();

// ---- Basic setup ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true })); // reads form submissions
app.use(express.static(path.join(__dirname, 'public'))); // css/images
app.use(methodOverride('_method')); // lets HTML forms send PUT/DELETE

// ---- Sessions (keeps you "logged in" between page loads) ----
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

// Makes the logged-in user available in every EJS template as `currentUser`
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// ---- Routes ----
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/org', orgRoutes);
app.use('/assets', assetRoutes);

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AssetFlow running: http://localhost:${PORT}`);
});
