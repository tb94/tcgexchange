function authMiddleware(req, res, next) {
  console.log('🔒 Checking auth:', req.session);

  if (req.session && req.session.user) {
    console.log('✅ Authenticated as:', req.session.user);
    return next();
  }

  console.log('❌ Not authenticated.');
  return res.status(401).json({ error: 'Unauthorized. Please log in.' });
}

module.exports = authMiddleware;
