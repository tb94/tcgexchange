import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as models from '../../models/index.js';

const { User } = models.default;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// User Signup
export async function signup(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const hashedPassword = await hash(password, 10);

    // look for existing user,
    // if a user does not exist `created` will be true and the new user instance will be returned
    const [user, created] = await User.findOrCreate({
      where: { username },
      // set the password only if the user does not exist yet.
      defaults: { password: hashedPassword }
    });

    if (!created) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    return res.json({ token });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// User Login
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Token Validation
export async function validate(req, res) {
  res.sendStatus(200); // Token is valid if it passes auth middleware
}

// Get Current User
export async function getCurrentUser(req, res) {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'username']
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
