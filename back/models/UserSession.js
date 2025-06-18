// back/src/models/UserSession.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const UserSession = sequelize.define('UserSession', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
}, { timestamps: true });

User.hasMany(UserSession, { foreignKey: 'userId' });
UserSession.belongsTo(User,  { foreignKey: 'userId' });

module.exports = UserSession;
