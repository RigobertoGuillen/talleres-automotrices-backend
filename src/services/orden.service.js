const BaseService = require('./base.service');
const OrdenRepository = require('../repositories/orden.repository');

class OrdenService extends BaseService {
  constructor() {
    super(OrdenRepository);
    this.ESTADOS_VALIDOS = ['recibido', 'en reparacion', 'listo', 'entregado'];
  }

  async create(ordenData) {
    try {
      const { vehiculo_id, descripcion_problema, prioridad = 0 } = ordenData;

      if (!vehiculo_id || !descripcion_problema) {
        return { success: false, message: 'Vehículo y descripción del problema son obligatorios' };
      }

      const vehiculo = await this.repository.checkVehiculo(vehiculo_id);
      if (!vehiculo) {
        return { success: false, message: 'Vehículo no encontrado' };
      }

      const orden = await this.repository.create({ vehiculo_id, descripcion_problema, prioridad });

      return { success: true, message: 'Orden de trabajo creada correctamente', data: orden };
    } catch (error) {
      console.error('Error en OrdenService.create:', error.message);
      return { success: false, message: error.message || 'Error al crear orden de trabajo' };
    }
  }

  async getById(numero_orden) {
    try {
      if (!numero_orden) {
        return { success: false, message: 'Número de orden es obligatorio' };
      }

      const orden = await this.repository.findById(numero_orden);
      if (!orden) {
        return { success: false, message: 'Orden no encontrada' };
      }
      return { success: true, data: orden };
    } catch (error) {
      console.error('Error en OrdenService.getById:', error.message);
      return { success: false, message: error.message || 'Error al obtener orden' };
    }
  }

  async getAll(filtros = {}) {
    try {
      const ordenes = await this.repository.findAll(filtros);
      return { success: true, data: ordenes };
    } catch (error) {
      console.error('Error en OrdenService.getAll:', error.message);
      return { success: false, message: error.message || 'Error al obtener órdenes' };
    }
  }

  async asignarMecanico(numero_orden, mecanico_id) {
    try {
      if (!mecanico_id) {
        return { success: false, message: 'Mecánico es obligatorio' };
      }

      const orden = await this.repository.asignarMecanico(numero_orden, mecanico_id);
      if (!orden) {
        return { success: false, message: 'Orden no encontrada' };
      }

      return { success: true, message: 'Mecánico asignado correctamente', data: orden };
    } catch (error) {
      console.error('Error en OrdenService.asignarMecanico:', error.message);
      return { success: false, message: error.message || 'Error al asignar mecánico' };
    }
  }

  async actualizarEstado(numero_orden, estado, notas = null, usuario_id = null) {
    try {
      if (!estado || !this.ESTADOS_VALIDOS.includes(estado)) {
        return { success: false, message: `Estado inválido. Estados válidos: ${this.ESTADOS_VALIDOS.join(', ')}` };
      }

      const orden = await this.repository.actualizarEstado(numero_orden, estado);
      if (!orden) {
        return { success: false, message: 'Orden no encontrada' };
      }

      await this.repository.insertHistorial({ orden_id: numero_orden, estado, notas, usuario_id });

      return { success: true, message: 'Estado actualizado correctamente', data: orden };
    } catch (error) {
      console.error('Error en OrdenService.actualizarEstado:', error.message);
      return { success: false, message: error.message || 'Error al actualizar estado' };
    }
  }

  async cerrar(numero_orden, usuario_id = null) {
    try {
      const orden = await this.repository.cerrar(numero_orden);
      if (!orden) {
        return { success: false, message: 'Orden no encontrada o ya está cerrada' };
      }

      await this.repository.insertHistorial({
        orden_id: numero_orden,
        estado: 'entregado',
        notas: 'Orden cerrada',
        usuario_id
      });

      return { success: true, message: 'Orden cerrada correctamente', data: orden };
    } catch (error) {
      console.error('Error en OrdenService.cerrar:', error.message);
      return { success: false, message: error.message || 'Error al cerrar orden' };
    }
  }

  async reasignar(numero_orden, mecanico_id, usuario_id = null) {
    try {
      if (!mecanico_id) {
        return { success: false, message: 'Mecánico es obligatorio' };
      }

      const orden = await this.repository.reasignar(numero_orden, mecanico_id);
      if (!orden) {
        return { success: false, message: 'Orden no encontrada' };
      }

      await this.repository.insertHistorial({
        orden_id: numero_orden,
        estado: orden.estado,
        notas: `Reasignado a mecánico ID: ${mecanico_id}`,
        usuario_id
      });

      return { success: true, message: 'Orden reasignada correctamente', data: orden };
    } catch (error) {
      console.error('Error en OrdenService.reasignar:', error.message);
      return { success: false, message: error.message || 'Error al reasignar orden' };
    }
  }

  async getByMecanico(mecanico_id) {
    try {
      const ordenes = await this.repository.findByMecanico(mecanico_id);
      return { success: true, data: ordenes };
    } catch (error) {
      console.error('Error en OrdenService.getByMecanico:', error.message);
      return { success: false, message: error.message || 'Error al obtener órdenes del mecánico' };
    }
  }
}

module.exports = new OrdenService();