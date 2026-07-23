const BaseService = require('./base.service');
const ServicioRepository = require('../repositories/servicio.repository');

// DIP: ServicioService depende de la abstracción BaseService/repository
// (inyectado en el constructor), no de una implementación concreta de
// base de datos; si mañana cambia el repositorio, esta clase no se toca.
// SRP: aquí solo viven las reglas de negocio del catálogo de servicios
// (validaciones, mensajes); la consulta cruda vive en el repository y la
// traducción a HTTP en el controller.
class ServicioService extends BaseService {
  constructor() {
    super(ServicioRepository);
  }

  async servicioGetAll() {
    try {
      const servicios = await this.repository.servicioFindAll();
      return { success: true, data: servicios };
    } catch (error) {
      console.error('Error en servicioGetAll:', error.message);
      return { success: false, message: 'Error al obtener servicios' };
    }
  }

  async servicioGetById(id) {
    try {
      const servicio = await this.repository.servicioFindById(id);
      if (!servicio) {
        return { success: false, message: 'Servicio no encontrado' };
      }
      return { success: true, data: servicio };
    } catch (error) {
      console.error('Error en servicioGetById:', error.message);
      return { success: false, message: error.message };
    }
  }

  async servicioCreate(data) {
    try {
      const { nombre, descripcion, precio_base } = data;

      if (!nombre || !nombre.trim()) {
        return { success: false, message: 'El nombre es obligatorio' };
      }
      if (precio_base === undefined || precio_base === null || parseFloat(precio_base) < 0) {
        return { success: false, message: 'El precio base debe ser mayor o igual a 0' };
      }

      const existe = await this.repository.servicioFindByNombre(nombre.trim());
      if (existe) {
        return { success: false, message: 'Ya existe un servicio con este nombre' };
      }

      const servicio = await this.repository.servicioCreate({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim(),
        precio_base: parseFloat(precio_base)
      });

      return { success: true, message: 'Servicio creado correctamente', data: servicio };
    } catch (error) {
      console.error('Error en servicioCreate:', error.message);
      return { success: false, message: error.message || 'Error al crear servicio' };
    }
  }

  async servicioUpdate(id, data) {
    try {
      const existe = await this.repository.servicioFindById(id);
      if (!existe) {
        return { success: false, message: 'Servicio no encontrado' };
      }

      const { nombre, descripcion, precio_base } = data;
      if (!nombre || !nombre.trim()) {
        return { success: false, message: 'El nombre es obligatorio' };
      }
      if (precio_base === undefined || precio_base === null || parseFloat(precio_base) < 0) {
        return { success: false, message: 'El precio base debe ser mayor o igual a 0' };
      }

      const duplicado = await this.repository.servicioFindByNombre(nombre.trim());
      if (duplicado && String(duplicado.id) !== String(id)) {
        return { success: false, message: 'Ya existe un servicio con este nombre' };
      }

      const servicio = await this.repository.servicioUpdate(id, {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim(),
        precio_base: parseFloat(precio_base)
      });

      return { success: true, message: 'Servicio actualizado correctamente', data: servicio };
    } catch (error) {
      console.error('Error en servicioUpdate:', error.message);
      return { success: false, message: error.message || 'Error al actualizar servicio' };
    }
  }

  async servicioDelete(id) {
    try {
      const existe = await this.repository.servicioFindById(id);
      if (!existe) {
        return { success: false, message: 'Servicio no encontrado' };
      }
      const enUso = await this.repository.servicioCheckEnUso(id);
      if (enUso) {
        return { success: false, message: 'No se puede eliminar un servicio ya aplicado en órdenes de trabajo' };
      }
      await this.repository.servicioDelete(id);
      return { success: true, message: 'Servicio eliminado correctamente' };
    } catch (error) {
      console.error('Error en servicioDelete:', error.message);
      return { success: false, message: error.message || 'Error al eliminar servicio' };
    }
  }
}

module.exports = new ServicioService();
