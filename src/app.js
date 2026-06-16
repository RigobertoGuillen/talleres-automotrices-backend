const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
=======
require('./config/db');
>>>>>>> 26de220fb97122033ab3b87f93bcaa5b7e92a79e

const app = express();

app.use(cors());
app.use(express.json());
<<<<<<< HEAD
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error servidor'
  });
=======

app.get('/', (req, res) => {
  res.json({ message: 'API Taller Mecánico funcionando' });
>>>>>>> 26de220fb97122033ab3b87f93bcaa5b7e92a79e
});

module.exports = app;