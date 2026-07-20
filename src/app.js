// src/app.js - 🔄 ACTUALIZADO
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const ordenRoutes = require('./routes/ordenRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const diagnosticoRoutes = require('./routes/diagnosticoRoutes');

const ErrorHandler = require('./middlewares/errorHandler');

const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/diagnosticos', diagnosticoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

module.exports = app;