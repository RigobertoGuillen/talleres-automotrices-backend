const BaseService = require('./base.service');
const VehiculoRepository = require('../repositories/vehiculo.repository');

class VehiculoService extends BaseService {
  constructor() {
    super(VehiculoRepository);
    this.TIPOS_VALIDOS = ['Pickup', 'turismo', 'camioneta'];
  }

  async create(vehiculoData) {
    try {
      const { placa, marca_id, modelo, anio, tipo, cliente_id } = vehiculoData;

      if (!placa || !marca_id || !modelo || !anio || !tipo || !cliente_id) {
        return { success: false, message: 'Todos los campos obligatorios deben enviarse' };
      }

      const anioActual = new Date().getFullYear();
      if (anio < 1950 || anio > anioActual + 1) {
        return { success: false, message: 'Año inválido' };
      }

      if (!this.TIPOS_VALIDOS.includes(tipo)) {
        return { success: false, message: 'Tipo de vehículo inválido' };
      }

      const placaExistente = await this.repository.findByPlaca(placa);
      if (placaExistente) {
        return { success: false, message: 'Ya existe un vehículo con esta placa' };
      }

      const vehiculo = await this.repository.create(vehiculoData);
      return { success: true, data: vehiculo };
    } catch (error) {
      console.error('Error en VehiculoService.create:', error.message);
      return { success: false, message: error.message || 'Error al registrar vehículo' };
    }
  }

  async update(id, data) {
    try {
      const vehiculo = await this.repository.update(id, data);
      if (!vehiculo) {
        return { success: false, message: 'Vehículo no encontrado' };
      }
      return { success: true, data: vehiculo };
    } catch (error) {
      console.error('Error en VehiculoService.update:', error.message);
      return { success: false, message: error.message || 'Error al actualizar vehículo' };
    }
  }

  async getById(id) {
    try {
      const vehiculo = await this.repository.findById(id);
      if (!vehiculo) {
        return { success: false, message: 'Vehículo no encontrado' };
      }
      return { success: true, data: vehiculo };
    } catch (error) {
      console.error('Error en VehiculoService.getById:', error.message);
      return { success: false, message: error.message || 'Error al consultar vehículo' };
    }
  }

  async getAll() {
    try {
      const vehiculos = await this.repository.findAll();
      return { success: true, data: vehiculos };
    } catch (error) {
      console.error('Error en VehiculoService.getAll:', error.message);
      return { success: false, message: error.message || 'Error al listar vehículos' };
    }
  }

  async getAllMarcas() {
    try {
      const marcas = await this.repository.findAllMarcas();
      return { success: true, data: marcas };
    } catch (error) {
      console.error('Error en VehiculoService.getAllMarcas:', error.message);
      return { success: false, message: error.message || 'Error al listar marcas' };
    }
  }

  async search(query) {
    try {
      if (!query || query.trim() === '') {
        return await this.getAll();
      }
      const vehiculos = await this.repository.buscar(query.trim());
      return { success: true, data: vehiculos };
    } catch (error) {
      console.error('Error en VehiculoService.search:', error.message);
      return { success: false, message: error.message || 'Error al buscar vehículos' };
    }
  }

  async getByCliente(clienteId) {
    try {
      const vehiculos = await this.repository.findByCliente(clienteId);
      return { success: true, data: vehiculos };
    } catch (error) {
      console.error('Error en VehiculoService.getByCliente:', error.message);
      return { success: false, message: error.message || 'Error al obtener vehículos del cliente' };
    }
  }

  async getHistorial(vehiculoId) {
    try {
      if (!vehiculoId) {
        return { success: false, message: 'ID de vehículo es obligatorio' };
      }
      const historial = await this.repository.historial(vehiculoId);
      return { success: true, data: historial };
    } catch (error) {
      console.error('Error en VehiculoService.getHistorial:', error.message);
      return { success: false, message: error.message || 'Error al obtener historial del vehículo' };
    }
  }
}

module.exports = new VehiculoService();