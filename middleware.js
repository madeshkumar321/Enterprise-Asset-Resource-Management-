// Reusable checks used before letting a request reach a route

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Usage: requireRole('Admin') or requireRole('Admin', 'AssetManager')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).send('You do not have permission to view this page.');
    }
    next();
  };
}

module.exports = { requireLogin, requireRole };
