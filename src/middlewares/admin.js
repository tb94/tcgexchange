import { User } from '../../models/index.js';

export default async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.isActive) return res.status(403).json({ error: 'Access denied' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = user;
    return next();
  } catch (e) {
    return res.status(500).json({ error: 'Failed to verify admin access' });
  }
};
