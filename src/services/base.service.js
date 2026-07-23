
class BaseService {
  constructor(repository) {
    this.repository = repository;
  }
  handleError(error, defaultMessage = 'Error interno del servidor') {
    console.error('Service Error:', error);
    throw new Error(error.message || defaultMessage);
  }
  validateRequired(data, fields) {
    for (const field of fields) {
      if (!data[field]) {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }
  }
}

module.exports = BaseService;