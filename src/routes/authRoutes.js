const express = require('express');
const { 
  login, 
  register, 
  solicitarRecuperacion, 
  restablecerPassword 
} = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', login);
router.post('/recuperar', solicitarRecuperacion);
router.post('/restablecer', restablecerPassword);
router.post('/register', verificarToken, verificarRol(['administrador']), register);

module.exports = router;