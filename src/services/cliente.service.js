const BaseService = require('./base.service');
const ClienteRepository = require('../repositories/cliente.repository');

class ClienteService extends BaseService {
  constructor() {
    super(ClienteRepository);
  }

  async getAll() {
    try {
      const clientes = await this.repository.findAll();
      return { success: true, data: clientes };
    } catch (error) {
      console.error('Error en ClienteService.getAll:', error.message);
      return { success: false, message: error.message || 'Error al obtener clientes' };
    }
  }

  async getById(id) {
    try {
      const cliente = await this.repository.findById(id);
      if (!cliente) {
        return { success: false, message: 'Cliente no encontrado' };
      }
      return { success: true, data: cliente };
    } catch (error) {
      console.error('Error en ClienteService.getById:', error.message);
      return { success: false, message: error.message || 'Error al obtener cliente' };
    }
  }

  async getByDni(dni) {
    try {
      const cliente = await this.repository.findByDni(dni);
      if (!cliente) {
        return { success: false, message: 'Cliente no encontrado' };
      }
      return { success: true, data: cliente };
    } catch (error) {
      console.error('Error en ClienteService.getByDni:', error.message);
      return { success: false, message: error.message || 'Error al buscar cliente por DNI' };
    }
  }

  async searchByNombre(query) {
    try {
      if (!query) {
        return { success: false, message: 'Debe ingresar un término de búsqueda' };
      }
      const clientes = await this.repository.findByNombre(query);
      return { success: true, data: clientes };
    } catch (error) {
      console.error('Error en ClienteService.searchByNombre:', error.message);
      return { success: false, message: error.message || 'Error al buscar clientes' };
    }
  }

  async create(clienteData) {
    try {
      const { dni, primer_nombre, primer_apellido, telefono } = clienteData;

      if (!dni || !primer_nombre || !primer_apellido || !telefono) {
        return { success: false, message: 'DNI, primer nombre, primer apellido y teléfono son obligatorios' };
      }

      const existe = await this.repository.findByDni(dni);
      if (existe) {
        return { success: false, message: 'Ya existe un cliente con este DNI' };
      }

      let direccion_id = null;
      if (clienteData.direccion) {
        direccion_id = await this.repository.createDireccion(clienteData.direccion);
      }

      const cliente = await this.repository.create({
        ...clienteData,
        direccion_id
      });

      return {
        success: true,
        message: 'Cliente creado correctamente',
        data: cliente
      };
    } catch (error) {
      console.error('Error en ClienteService.create:', error.message);
      return { success: false, message: error.message || 'Error al crear cliente' };
    }
  }

  async update(id, data) {
    try {
      const clienteExistente = await this.repository.findById(id);
      if (!clienteExistente) {
        return { success: false, message: 'Cliente no encontrado' };
      }

      const camposAMonitorear = ['primer_nombre', 'telefono', 'correo', 'direccion'];
      for (const campo of camposAMonitorear) {
        if (data[campo] && data[campo] !== clienteExistente[campo]) {
          await this.repository.registrarAuditoria({
            cliente_id: id,
            campo_modificado: campo,
            valor_anterior: clienteExistente[campo],
            valor_nuevo: data[campo]
          });
        }
      }

      const cliente = await this.repository.update(id, data);

      return {
        success: true,
        message: 'Cliente actualizado correctamente',
        data: cliente
      };
    } catch (error) {
      console.error('Error en ClienteService.update:', error.message);
      return { success: false, message: error.message || 'Error al actualizar cliente' };
    }
  }

  async delete(id) {
    try {
      const cliente = await this.repository.findById(id);
      if (!cliente) {
        return { success: false, message: 'Cliente no encontrado' };
      }

      const tieneOrdenes = await this.repository.checkOrdenes(id);
      if (tieneOrdenes) {
        return { success: false, message: 'No se puede eliminar un cliente con órdenes de trabajo asociadas' };
      }

      await this.repository.delete(id);

      return {
        success: true,
        message: 'Cliente eliminado correctamente'
      };
    } catch (error) {
      console.error('Error en ClienteService.delete:', error.message);
      return { success: false, message: error.message || 'Error al eliminar cliente' };
    }
  }

  async getHistorial(id, fechaInicio, fechaFin) {
    try {
      const cliente = await this.repository.findById(id);
      if (!cliente) {
        return { success: false, message: 'Cliente no encontrado' };
      }

      const historial = await this.repository.getHistorial(id, fechaInicio, fechaFin);

      return {
        success: true,
        data: {
          cliente,
          historial
        }
      };
    } catch (error) {
      console.error('Error en ClienteService.getHistorial:', error.message);
      return { success: false, message: error.message || 'Error al obtener historial' };
    }
  }
}

module.exports = new ClienteService();