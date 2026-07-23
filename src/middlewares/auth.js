const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt');
const ERROR_MESSAGES = require('../constants/messages/errorMessages');


const ROLES = {
  ADMIN: 'administrador',
  MECANICO: 'mecanico',
  RECEPCIONISTA: 'recepcionista'
};

const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.TOKEN_NO_PROVIDED
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.TOKEN_INVALIDO
    });
  }
};

const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.NO_AUTORIZADO
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.ACCESO_DENEGADO
      });
    }
    next();
  };
};

module.exports = {
  verificarToken,
  verificarRol,
  ROLES
};