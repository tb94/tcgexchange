const { Sequelize } = require('sequelize');
const config = require('../config/config.json')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config);

const db = {
  sequelize,
  Sequelize,
  User: require('./user')(sequelize, Sequelize),
};

module.exports = db;
