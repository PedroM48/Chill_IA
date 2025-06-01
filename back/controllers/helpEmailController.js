// controllers/helpEmailController.js
const nodemailer = require("nodemailer");
const User = require("../models/User");           

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",                        
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,               
    pass: process.env.MAIL_PASS,
  },
});

exports.sendHelpEmail = async (req, res) => {
  try {
    // req.user.id viene de tu middleware validateToken
    const user = await User.findByPk(req.user.id);
    if (!user || !user.contacto_correo) {
      return res.status(400).json({ message: "No hay contacto registrado" });
    }

    const to = user.contacto_correo;
    const nombreContacto = user.contacto_nombre || "amigo";
    const nombreUsuario  = user.nombre || "Tu amigo/a";

    const text = `Hola ${nombreContacto},\n\n` +
      `${nombreUsuario} está pasando un momento difícil y le ayudaría mucho hablar contigo.\n` +
      `¿Tienes un momento para escucharle?\n\n` +
      `— Enviado automáticamente desde la app CHILL IA`;
    console.log(process.env.MAIL_USER)
    await transporter.sendMail({
      from: `"CHILL IA" <${process.env.MAIL_USER}>`,
      to,
      subject: "¿Puedes hablar un momento?",
      text,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error enviando correo" });
  }
};
