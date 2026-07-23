const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const {
  getServiciosRealizados,
  getVehiculosAtendidos,
  getRepuestosUtilizados,
  getIngresos,
  getPorMecanico,
  getOrdenesPendientes,
  getDashboard
} = require('../controllers/reporteController');

router.use(verificarToken);
router.use(verificarRol('administrador'));

router.get('/servicios', getServiciosRealizados);
router.get('/vehiculos', getVehiculosAtendidos);
router.get('/repuestos', getRepuestosUtilizados);
router.get('/ingresos', getIngresos);
router.get('/mecanicos', getPorMecanico);
router.get('/ordenes-pendientes', getOrdenesPendientes);
router.get('/dashboard', getDashboard);

module.exports = router;