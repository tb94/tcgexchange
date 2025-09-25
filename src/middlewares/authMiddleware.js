// src/middleware/authMiddleware.js

function authMiddleware(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // user is authenticated, continue
  }

  return res.status(401).json({ error: 'Unauthorized. Please log in.' });
}

module.exports = authMiddleware;
