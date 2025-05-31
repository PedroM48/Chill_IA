const express = require('express');
const cors = require('cors'); // 👈 importar cors
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();
app.use(cors()); // 👈 habilita CORS para todos los orígenes
app.use(express.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 4000;
sequelize.sync()
  .then(() => {
    console.log('Conectado a la base de datos');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => console.error('Error al conectar DB:', err));
