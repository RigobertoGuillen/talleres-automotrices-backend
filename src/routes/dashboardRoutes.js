const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

router.use(verificarToken, verificarRol('administrador'));

router.get('/stats', dashboardController.getStats);
router.get('/ordenes-recientes', dashboardController.getOrdenesRecientes);
router.get('/carga-mecanicos', dashboardController.getCargaMecanicos);
router.get('/alertas', dashboardController.getAlertas);

module.exports = router;