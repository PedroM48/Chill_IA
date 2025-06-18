// back/src/models/AnalyticsEvent.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const ChatSession = require('./ChatSession');

const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  event:      { type: DataTypes.STRING, allowNull: false },  // e.g. 'option_selected', 'abandon', 'emergency_reached'
  metadata:   { type: DataTypes.JSON,   allowNull: true },    // { questionId, optionId, score, level, … }
}, { timestamps: true }); // createdAt = momento del evento

User.hasMany(AnalyticsEvent,   { foreignKey: 'userId' });
AnalyticsEvent.belongsTo(User, { foreignKey: 'userId' });
ChatSession.hasMany(AnalyticsEvent,   { foreignKey: 'chatSessionId' });
AnalyticsEvent.belongsTo(ChatSession, { foreignKey: 'chatSessionId' });

module.exports = AnalyticsEvent;
