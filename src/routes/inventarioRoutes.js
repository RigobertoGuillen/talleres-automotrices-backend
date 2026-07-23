const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getRepuestos,
  getRepuestoById,
  buscarRepuestos,
  crearRepuestoCompleto,
  updateRepuesto,
  deleteRepuesto,
  consultarStock,
  getAlertasStock,
  crearMovimiento,
  getMovimientos,
  getMovimientosByRepuesto,
  crearSolicitud,
  aprobarSolicitud,
  getSolicitudesPendientes,
  getSolicitudesByOrden,
  getSolicitudes
} = require('../controllers/inventarioController');

router.use(verificarToken);
router.get('/categorias', getCategorias);
router.get('/categorias/:id', getCategoriaById);
router.post('/categorias', verificarRol('administrador'), createCategoria);
router.put('/categorias/:id', verificarRol('administrador'), updateCategoria);
router.delete('/categorias/:id', verificarRol('administrador'), deleteCategoria);
router.post('/repuestos', verificarRol('administrador'), crearRepuestoCompleto);
router.get('/repuestos', getRepuestos);
router.get('/repuestos/buscar', buscarRepuestos);
router.get('/repuestos/:id', getRepuestoById);
router.put('/repuestos/:id', verificarRol('administrador'), updateRepuesto);
router.delete('/repuestos/:id', verificarRol('administrador'), deleteRepuesto);
router.get('/stock', consultarStock);
router.get('/stock/alertas', getAlertasStock);
router.post('/movimientos', verificarRol('administrador'), crearMovimiento);
router.get('/movimientos', verificarRol('administrador'), getMovimientos);
router.get('/movimientos/repuesto/:repuestoId', getMovimientosByRepuesto);
router.post('/solicitudes', crearSolicitud);
router.get('/solicitudes/pendientes', verificarRol('administrador'), getSolicitudesPendientes);
router.patch('/solicitudes/:id/aprobar', verificarRol('administrador'), aprobarSolicitud);
router.get('/solicitudes/orden/:ordenId', getSolicitudesByOrden);
router.get('/solicitudes', verificarRol('administrador'), getSolicitudes);

module.exports = router;