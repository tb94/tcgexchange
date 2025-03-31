const { User } = require('../../models');

const getUsers = async (req, res) => {
  const users = await User.findAll();
  res.json(users);
};

const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Email must be unique" });
  }
};

module.exports = { getUsers, createUser };
