const AuthService = require('../services/auth.service');

const login = async (req, res) => {
  try {
    const { nombre_usuario, contrasena } = req.body;
    const result = await AuthService.login(nombre_usuario, contrasena);
    
    if (!result.success) {
      const statusMap = {
        'Usuario y contraseña son obligatorios': 400,
        'Usuario inactivo': 401,
        'Credenciales inválidas': 401
      };
      const status = statusMap[result.message] || 500;
      return res.status(status).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await AuthService.solicitarRecuperacion(email);
    
    if (!result.success) {
      const statusMap = {
        'Email es obligatorio': 400,
        'No existe un usuario con este email': 404
      };
      const status = statusMap[result.message] || 500;
      return res.status(status).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

const restablecerPassword = async (req, res) => {
  try {
    const { token, nueva_contrasena } = req.body;
    const result = await AuthService.restablecerPassword(token, nueva_contrasena);
    
    if (!result.success) {
      const statusMap = {
        'Token y nueva contraseña son obligatorios': 400,
        'Token inválido o expirado': 400,
        'Token inválido': 400
      };
      const status = statusMap[result.message] || 500;
      return res.status(status).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en restablecerPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña'
    });
  }
};

const register = async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    
    if (!result.success) {
      const statusMap = {
        'Todos los campos son obligatorios': 400,
        'El nombre de usuario ya existe': 400,
        'El correo ya está registrado': 400
      };
      const status = statusMap[result.message] || 500;
      return res.status(status).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  login,
  register,
  solicitarRecuperacion,
  restablecerPassword
};