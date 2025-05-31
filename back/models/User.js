const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellidos: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  edad: { type: DataTypes.INTEGER },
  distrito: { type: DataTypes.STRING },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  contacto_nombre: { type: DataTypes.STRING },
  contacto_correo: { type: DataTypes.STRING },
  contacto_whatsapp: { type: DataTypes.STRING }
});

module.exports = User;