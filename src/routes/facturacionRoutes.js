const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const {
  getCais,
  getCaiActivo,
  createCai,
  getFacturaPreview,
  generarFactura,
  getFacturas,
  getFacturaById,
  registrarPago
} = require('../controllers/facturacionController');

router.use(verificarToken);

// ISP: cada ruta expone solo la operación que ese rol necesita. Facturación
// (ver/generar) es de administrador y recepcionista, igual que el resto del
// módulo; pero subir/actualizar autorizaciones CAI es exclusivo del
// administrador, tal como se pidió explícitamente.
router.get('/cai', verificarRol('administrador', 'recepcionista'), getCais);
router.get('/cai/activo', verificarRol('administrador', 'recepcionista'), getCaiActivo);
router.post('/cai', verificarRol('administrador'), createCai);

router.get('/ordenes/:ordenId/detalle', verificarRol('administrador', 'recepcionista'), getFacturaPreview);
router.post('/ordenes/:ordenId/generar', verificarRol('administrador', 'recepcionista'), generarFactura);

router.get('/facturas', verificarRol('administrador', 'recepcionista'), getFacturas);
router.get('/facturas/:id', verificarRol('administrador', 'recepcionista'), getFacturaById);
router.patch('/facturas/:id/pago', verificarRol('administrador', 'recepcionista'), registrarPago);

module.exports = router;
