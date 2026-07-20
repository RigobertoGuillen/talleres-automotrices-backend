const ERROR_MESSAGES = require('../constants/messages/errorMessages');

class ErrorHandler {
  static handle(err, req, res, next) {
    console.error('Error:', err);

// Mapeo de errores 
    const errorMap = {
      'Credenciales inválidas': 401,
      'Token no proporcionado': 401,
      'Token inválido o expirado': 401,
      'Usuario no autenticado': 401,
      'Usuario no autorizado': 403,
      'Cliente no encontrado': 404,
      'Usuario no encontrado': 404,
      'Vehículo no encontrado': 404,
      'Orden no encontrada': 404,
      'El nombre de usuario ya existe': 409,
      'El correo ya está registrado': 409,
      'Ya existe un cliente con este DNI': 409,
      'Ya existe un vehículo con esta placa': 409
    };

 
    let status = 500;
    let message = ERROR_MESSAGES.ERROR_SERVIDOR;

    for (const [errorMessage, statusCode] of Object.entries(errorMap)) {
      if (err.message && err.message.includes(errorMessage)) {
        status = statusCode;
        message = err.message;
        break;
      }
    }

    if (err.status) {
      status = err.status;
      message = err.message;
    }

    res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }


  static notFound(req, res) {
    res.status(404).json({
      success: false,
      message: 'Ruta no encontrada'
    });
  }
}

module.exports = ErrorHandler;