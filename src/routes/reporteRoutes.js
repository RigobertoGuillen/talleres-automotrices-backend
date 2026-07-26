const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const {
  reporteServicios,
  reporteVehiculosAtendidos,
  reporteInventarioUtilizado,
  reporteIngresos,
  reporteMecanicos,
  listarMecanicosActivos,
  reporteOrdenesPendientes,
  dashboardGeneral,
} = require('../controllers/reporteController');

router.use(verificarToken);

// Todas las HU-39 a HU-44 son "Como Administrador" en las historias de usuario.
router.get('/servicios', verificarRol('administrador'), reporteServicios);
router.get('/vehiculos-atendidos', verificarRol('administrador'), reporteVehiculosAtendidos);
router.get('/inventario-utilizado', verificarRol('administrador'), reporteInventarioUtilizado);
router.get('/ingresos', verificarRol('administrador'), reporteIngresos);
router.get('/mecanicos', verificarRol('administrador'), reporteMecanicos);
router.get('/mecanicos/activos', verificarRol('administrador'), listarMecanicosActivos);
router.get('/ordenes-pendientes', verificarRol('administrador'), reporteOrdenesPendientes);

// HU-45: el dashboard general también se sirve aquí, sin restricción de rol
// más allá de estar autenticado (lo consumen administrador y recepcionista).
router.get('/dashboard', dashboardGeneral);

module.exports = router;
