const express = require('express');
const {
  createOrden,
  getOrdenById,
  getOrdenes,
  asignarMecanico,
  actualizarEstado,
  cerrarOrden,
  getOrdenesByMecanico,
  reasignarOrden
} = require('../controllers/ordenController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

const router = express.Router();

router.use(verificarToken);

router.post('/', verificarRol('administrador', 'recepcionista'), createOrden);
router.get('/:id', verificarRol('administrador', 'recepcionista', 'mecanico'), getOrdenById);
router.get('/', verificarRol('administrador', 'recepcionista'), getOrdenes);
router.patch('/:id/asignar', verificarRol('administrador', 'recepcionista'), asignarMecanico);
router.patch('/:id/estado', verificarRol('administrador', 'mecanico'), actualizarEstado);
router.patch('/:id/cerrar', verificarRol('administrador', 'mecanico'), cerrarOrden);
router.get('/mecanico/:id', verificarRol('administrador', 'mecanico'), getOrdenesByMecanico);
router.patch('/:id/reasignar', verificarRol('administrador'), reasignarOrden);
module.exports = router;