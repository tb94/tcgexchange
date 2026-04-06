/* eslint-disable strict */

'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const db = {};
// eslint-disable-next-line import/no-dynamic-require
const config = require('../config/config.json')[process.env.NODE_ENV || 'development'];

// Ensure sqlite storage path is stable regardless of process cwd.
// config.storage is relative in config/config.json; resolve it relative to repo root.
const resolvedConfig = { ...config };
if (resolvedConfig.dialect === 'sqlite' && resolvedConfig.storage && !path.isAbsolute(resolvedConfig.storage)) {
  resolvedConfig.storage = path.resolve(__dirname, '..', resolvedConfig.storage);
}

const sequelize = new Sequelize(resolvedConfig.database, resolvedConfig.username, resolvedConfig.password, resolvedConfig);

fs
  .readdirSync(__dirname)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
