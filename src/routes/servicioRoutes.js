const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const {
  getServicios,
  getServicioById,
  createServicio,
  updateServicio,
  deleteServicio,
  getServiciosByOrden,
  registrarServicioEnOrden,
  eliminarServicioDeOrden
} = require('../controllers/servicioController');

router.use(verificarToken);

// ISP: cada ruta expone solo la operación que ese rol necesita en vez de un
// único endpoint "todo en uno" con permisos mezclados adentro; el catálogo
// se puede consultar por cualquier usuario autenticado, pero solo el
// administrador puede agregar, editar o eliminar servicios del catálogo.
router.get('/', getServicios);

// Servicios aplicados a una orden (sub-panel de Diagnósticos). Mismo
// esquema de roles que diagnosticoRoutes: administrador/mecánico
// registran y quitan, recepcionista solo consulta.
router.get('/orden/:ordenId', verificarRol('administrador', 'mecanico', 'recepcionista'), getServiciosByOrden);
router.post('/orden', verificarRol('administrador', 'mecanico'), registrarServicioEnOrden);
router.delete('/orden/:id', verificarRol('administrador', 'mecanico'), eliminarServicioDeOrden);

router.get('/:id', getServicioById);
router.post('/', verificarRol('administrador'), createServicio);
router.put('/:id', verificarRol('administrador'), updateServicio);
router.delete('/:id', verificarRol('administrador'), deleteServicio);

module.exports = router;
