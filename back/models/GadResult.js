// src/models/GadResult.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const GadResult = sequelize.define('GadResult', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  score: { type: DataTypes.INTEGER, allowNull: false },
  responses: { type: DataTypes.JSON, allowNull: false },
}, { timestamps: true });

User.hasMany(GadResult, { foreignKey: 'userId' });
GadResult.belongsTo(User,  { foreignKey: 'userId' });

module.exports = GadResult;
