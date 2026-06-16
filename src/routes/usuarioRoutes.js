const express = require('express');
const {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  toggleEstado,
  deleteUsuario
} = require('../controllers/usuarioController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

const router = express.Router();


router.use(verificarToken);
router.get('/', verificarRol('administrador'), getUsuarios);
router.get('/:id', verificarRol('administrador'), getUsuarioById);
router.post('/', verificarRol('administrador'), createUsuario);
router.put('/:id', verificarRol('administrador'), updateUsuario);
router.patch('/:id/estado', verificarRol('administrador'), toggleEstado);
router.delete('/:id', verificarRol('administrador'), deleteUsuario);

module.exports = router;