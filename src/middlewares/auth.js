const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt');

const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.usuario = decoded;
    next();
    } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no autorizado'
      });
    }
    next();
  };
};
module.exports = {
  verificarToken,
  verificarRol
};