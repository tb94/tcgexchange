import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/index.js';

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl } });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl } });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'avatarUrl'] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid current password' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change password' });
  }
}

async function updateAvatar(req, res) {
  try {
    const { avatarUrl } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.avatarUrl = avatarUrl || null;
    await user.save();
    return res.json({ ok: true, user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
}

export default {
  register,
  login,
  me,
  changePassword,
  updateAvatar
};
