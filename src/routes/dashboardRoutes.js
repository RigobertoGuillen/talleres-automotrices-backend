const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.use(verificarToken);

router.get('/stats', verificarRol('administrador'), dashboardController.getStats);
router.get('/ordenes-recientes', verificarRol('administrador', 'recepcionista'), dashboardController.getOrdenesRecientes);
router.get('/carga-mecanicos', verificarRol('administrador'), dashboardController.getCargaMecanicos);
router.get('/alertas', verificarRol('administrador', 'recepcionista'), dashboardController.getAlertas);

module.exports = router;