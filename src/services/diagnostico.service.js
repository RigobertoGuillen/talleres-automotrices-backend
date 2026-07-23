const BaseService = require('./base.service');
const DiagnosticoRepository = require('../repositories/diagnostico.repository');

class DiagnosticoService extends BaseService {
  constructor() {
    super(DiagnosticoRepository);
    this.ESTADOS_VALIDOS = ['pendiente', 'en proceso', 'completado'];
  }

  async create(diagnosticoData) {
    try {
      const { orden_id, descripcion_falla, estado } = diagnosticoData;

      if (!orden_id) {
        return { success: false, message: 'El campo orden_id es obligatorio' };
      }
      if (!descripcion_falla) {
        return { success: false, message: 'El campo descripcion_falla es obligatorio' };
      }

      let estadoFinal = 'pendiente';
      if (estado) {
        if (!this.ESTADOS_VALIDOS.includes(estado)) {
          return { success: false, message: `Estado inválido. Valores permitidos: ${this.ESTADOS_VALIDOS.join(', ')}` };
        }
        estadoFinal = estado;
      }

      const ordenExiste = await this.repository.ordenExiste(orden_id);
      if (!ordenExiste) {
        return { success: false, message: 'La orden de trabajo indicada no existe' };
      }

      const diagnostico = await this.repository.create({
        orden_id,
        descripcion_falla,
        observaciones: diagnosticoData.observaciones || null,
        recomendaciones: diagnosticoData.recomendaciones || null,
        estado: estadoFinal,
        mecanico_id: diagnosticoData.mecanico_id || null
      });

      return { success: true, data: diagnostico };
    } catch (error) {
      console.error('Error en DiagnosticoService.create:', error.message);
      return { success: false, message: error.message || 'Error al registrar diagnóstico' };
    }
  }

  async getAll(filtros = {}) {
    try {
      const { estado, q, orden_id, orden } = filtros;

      if (estado && !this.ESTADOS_VALIDOS.includes(estado)) {
        return { success: false, message: `Estado inválido. Valores permitidos: ${this.ESTADOS_VALIDOS.join(', ')}` };
      }

      const diagnosticos = await this.repository.findAll({ estado, q, orden_id, orden });
      return { success: true, data: diagnosticos };
    } catch (error) {
      console.error('Error en DiagnosticoService.getAll:', error.message);
      return { success: false, message: error.message || 'Error al consultar diagnósticos' };
    }
  }

  async getById(id) {
    try {
      if (!id || isNaN(parseInt(id))) {
        return { success: false, message: 'ID inválido' };
      }

      const diagnostico = await this.repository.findById(parseInt(id));
      if (!diagnostico) {
        return { success: false, message: 'Diagnóstico no encontrado' };
      }
      return { success: true, data: diagnostico };
    } catch (error) {
      console.error('Error en DiagnosticoService.getById:', error.message);
      return { success: false, message: error.message || 'Error al consultar diagnóstico' };
    }
  }

  async getByOrden(ordenId) {
    try {
      if (!ordenId) {
        return { success: false, message: 'El ID de la orden es obligatorio' };
      }

      const ordenExiste = await this.repository.ordenExiste(ordenId);
      if (!ordenExiste) {
        return { success: false, message: 'La orden de trabajo indicada no existe' };
      }

      const diagnosticos = await this.repository.findByOrden(ordenId);
      return { success: true, data: diagnosticos };
    } catch (error) {
      console.error('Error en DiagnosticoService.getByOrden:', error.message);
      return { success: false, message: error.message || 'Error al consultar el historial de diagnósticos' };
    }
  }

  async update(id, data) {
    try {
      if (!id || isNaN(parseInt(id))) {
        return { success: false, message: 'ID inválido' };
      }

      const diagnostico = await this.repository.update(parseInt(id), data);
      if (!diagnostico) {
        return { success: false, message: 'Diagnóstico no encontrado' };
      }
      return { success: true, data: diagnostico };
    } catch (error) {
      console.error('Error en DiagnosticoService.update:', error.message);
      return { success: false, message: error.message || 'Error al actualizar diagnóstico' };
    }
  }

  async updateObservaciones(id, observaciones) {
    try {
      if (!id || isNaN(parseInt(id))) {
        return { success: false, message: 'ID inválido' };
      }

      if (!observaciones || !observaciones.trim()) {
        return { success: false, message: 'Las observaciones no pueden estar vacías' };
      }

      const diagnostico = await this.repository.updateObservaciones(parseInt(id), observaciones.trim());
      if (!diagnostico) {
        return { success: false, message: 'Diagnóstico no encontrado' };
      }

      return { success: true, message: 'Observaciones registradas correctamente', data: diagnostico };
    } catch (error) {
      console.error('Error en DiagnosticoService.updateObservaciones:', error.message);
      return { success: false, message: error.message || 'Error al registrar observaciones' };
    }
  }

  async updateEstado(id, estado) {
    try {
      if (!id || isNaN(parseInt(id))) {
        return { success: false, message: 'ID inválido' };
      }

      if (!estado || !this.ESTADOS_VALIDOS.includes(estado)) {
        return { success: false, message: `Estado inválido. Valores permitidos: ${this.ESTADOS_VALIDOS.join(', ')}` };
      }

      const diagnostico = await this.repository.updateEstado(parseInt(id), estado);
      if (!diagnostico) {
        return { success: false, message: 'Diagnóstico no encontrado' };
      }

      return { success: true, message: 'Estado del diagnóstico actualizado correctamente', data: diagnostico };
    } catch (error) {
      console.error('Error en DiagnosticoService.updateEstado:', error.message);
      return { success: false, message: error.message || 'Error al actualizar el estado del diagnóstico' };
    }
  }
}

module.exports = new DiagnosticoService();