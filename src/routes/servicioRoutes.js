const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const {
  getServicios,
  getServicioById,
  createServicio,
  updateServicio,
  deleteServicio
} = require('../controllers/servicioController');

router.use(verificarToken);

// ISP: cada ruta expone solo la operación que ese rol necesita en vez de un
// único endpoint "todo en uno" con permisos mezclados adentro; el catálogo
// se puede consultar por cualquier usuario autenticado, pero solo el
// administrador puede agregar, editar o eliminar servicios del catálogo.
router.get('/', getServicios);
router.get('/:id', getServicioById);
router.post('/', verificarRol('administrador'), createServicio);
router.put('/:id', verificarRol('administrador'), updateServicio);
router.delete('/:id', verificarRol('administrador'), deleteServicio);

module.exports = router;
