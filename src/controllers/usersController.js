const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// User Signup
exports.signup = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
};

// User Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Token Validation
exports.validate = async (req, res) => {
  res.sendStatus(200); // Token is valid if it passes auth middleware
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
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
};
