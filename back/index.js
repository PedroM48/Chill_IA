const express = require('express');
const cors = require('cors'); // 👈 importar cors
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const gadRoutes = require('./routes/gadRoutes');
const chatRoutes      = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
require('dotenv').config();

const app = express();
const corsOptions = {
  origin: "https://chill-ia.onrender.com", // el dominio de tu frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/api/helpEmail", require("./routes/helpEmailRoutes"));
app.use('/api/gad', gadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);



const PORT = process.env.PORT || 4000;
sequelize.sync()
  .then(() => {
    console.log('Conectado a la base de datos');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => console.error('Error al conectar DB:', err));
