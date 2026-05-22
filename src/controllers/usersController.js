import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/index.js';

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: user.isActive
  };
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
    return res.json({ token, user: serializeUser(user) });
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
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({ token, user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });
    return res.json({ user: serializeUser(user) });
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
    return res.json({ ok: true, user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
}

async function adminListUsers(req, res) {
  try {
    const users = await User.findAll({ order: [['username', 'ASC']] });
    return res.json({ users: users.map((u) => serializeUser(u)) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list users' });
  }
}

async function adminCreateUser(req, res) {
  try {
    const {
      username, password, avatarUrl = null, role = 'user'
    } = req.body;

    if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      avatarUrl,
      role,
      isActive: true
    });
    return res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

async function adminUpdateUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid user id' });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { username, avatarUrl, role } = req.body;
    if (role && !['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(409).json({ error: 'Username already exists' });
      user.username = username;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'avatarUrl')) user.avatarUrl = avatarUrl || null;
    if (role) user.role = role;

    await user.save();
    return res.json({ user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

async function adminDeactivateUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { confirm } = req.body || {};
    if (!confirm) return res.status(400).json({ error: 'Confirmation required' });
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid user id' });
    if (id === req.admin.id) return res.status(400).json({ error: 'You cannot deactivate your own account' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isActive = false;
    await user.save();
    return res.json({ ok: true, user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
}

async function adminActivateUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid user id' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isActive = true;
    await user.save();
    return res.json({ ok: true, user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to activate user' });
  }
}

async function adminDeleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { confirm } = req.body || {};
    if (!confirm) return res.status(400).json({ error: 'Confirmation required' });
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid user id' });
    if (id === req.admin.id) return res.status(400).json({ error: 'You cannot delete your own account' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}

export default {
  register,
  login,
  me,
  changePassword,
  updateAvatar,
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeactivateUser,
  adminActivateUser,
  adminDeleteUser
};
