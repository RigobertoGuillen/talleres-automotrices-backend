const express = require('express');
const {
  getClientes,
  getClienteById,
  buscarClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getHistorialCliente
} = require('../controllers/clienteController');

const { verificarToken, verificarRol } = require('../middlewares/auth');

const router = express.Router();

router.use(verificarToken);

router.get(
  '/',
  verificarRol('administrador', 'recepcionista'),
  getClientes
);

router.get(
  '/buscar',
  verificarRol('administrador', 'recepcionista'),
  buscarClientes
);

router.get(
  '/:id',
  verificarRol('administrador', 'recepcionista'),
  getClienteById
);

router.post(
  '/',
  verificarRol('administrador', 'recepcionista'),
  createCliente
);

router.put(
  '/:id',
  verificarRol('administrador', 'recepcionista'),
  updateCliente
);

router.get(
  '/:id/historial',
  verificarRol('administrador', 'recepcionista', 'mecanico'),
  getHistorialCliente
);

router.delete(
  '/:id',
  verificarRol('administrador'),
  deleteCliente
);

module.exports = router;