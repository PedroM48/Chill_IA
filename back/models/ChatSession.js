// back/src/models/ChatSession.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const ChatSession = sequelize.define('ChatSession', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  endedAt: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true }); // createdAt=startedAt

User.hasMany(ChatSession, { foreignKey: 'userId' });
ChatSession.belongsTo(User,  { foreignKey: 'userId' });

module.exports = ChatSession;
