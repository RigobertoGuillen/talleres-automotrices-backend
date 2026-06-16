const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const JWT_SECRET = 'talleres_automotrices';
const login = async (req, res) => {
  try {
    const { nombre_usuario, contrasena } = req.body;
    if (!nombre_usuario || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son obligatorios'
      });
    }
    const usuario = await Usuario.findByUsername(nombre_usuario);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }
    if (contrasena !== usuario.contrasena_hash) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        rol: usuario.rol
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        nombre_usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = { login };