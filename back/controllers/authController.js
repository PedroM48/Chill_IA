const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

exports.register = async (req, res) => {
  const {
    nombre,
    apellidos,
    email,
    password,
    edad,
    distrito,
    contactoEmergenciaNombre: contacto_nombre,
    contactoEmergenciaCorreo: contacto_correo,
    contactoEmergenciaWhatsApp: contacto_whatsapp
  } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const user = await User.create({ nombre, apellidos, email, password_hash, edad, distrito, contacto_nombre, contacto_correo, contacto_whatsapp });
    res.status(201).json({ message: 'Usuario registrado', userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en servidor' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error({ message: 'Usuario no encontrado' });
    res.status(500).json({ message: 'Error en servidor' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en servidor' });
  }
};