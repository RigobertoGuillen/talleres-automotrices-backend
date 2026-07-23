const BaseService = require('./base.service');
const ReporteRepository = require('../repositories/reporte.repository');

class ReporteService extends BaseService {
  constructor() {
    super(ReporteRepository);
  }

  async getServiciosRealizados(fechaInicio, fechaFin) {
    try {
      if (!fechaInicio || !fechaFin) {
        fechaInicio = new Date(new Date().getFullYear(), 0, 1);
        fechaFin = new Date();
      }
      const data = await this.repository.getServiciosRealizados(fechaInicio, fechaFin);
      return { 
        success: true, 
        data,
        meta: {
          total_servicios: data.reduce((sum, item) => sum + parseInt(item.cantidad), 0),
          total_ingresos: data.reduce((sum, item) => sum + parseFloat(item.total_ingresos), 0)
        }
      };
    } catch (error) {
      console.error('Error en getServiciosRealizados:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getVehiculosAtendidos(fechaInicio, fechaFin) {
    try {
      if (!fechaInicio || !fechaFin) {
        fechaInicio = new Date(new Date().getFullYear(), 0, 1);
        fechaFin = new Date();
      }
      const data = await this.repository.getVehiculosAtendidos(fechaInicio, fechaFin);
      const tipos = {};
      data.forEach(item => {
        tipos[item.tipo] = (tipos[item.tipo] || 0) + parseInt(item.total_ordenes);
      });
      return {
        success: true,
        data,
        meta: {
          total_vehiculos: data.length,
          total_ordenes: data.reduce((sum, item) => sum + parseInt(item.total_ordenes), 0),
          por_tipo: tipos
        }
      };
    } catch (error) {
      console.error('Error en getVehiculosAtendidos:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getRepuestosUtilizados(fechaInicio, fechaFin) {
    try {
      if (!fechaInicio || !fechaFin) {
        fechaInicio = new Date(new Date().getFullYear(), 0, 1);
        fechaFin = new Date();
      }
      const data = await this.repository.getRepuestosUtilizados(fechaInicio, fechaFin);
      return {
        success: true,
        data,
        meta: {
          total_repuestos: data.reduce((sum, item) => sum + parseInt(item.total_utilizado), 0),
          total_valor: data.reduce((sum, item) => sum + parseFloat(item.valor_total), 0)
        }
      };
    } catch (error) {
      console.error('Error en getRepuestosUtilizados:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getIngresos(fechaInicio, fechaFin) {
    try {
      if (!fechaInicio || !fechaFin) {
        fechaInicio = new Date(new Date().getFullYear(), 0, 1);
        fechaFin = new Date();
      }
      const data = await this.repository.getIngresos(fechaInicio, fechaFin);
      return {
        success: true,
        data,
        meta: {
          total_facturas: data.reduce((sum, item) => sum + parseInt(item.total_facturas), 0),
          total_ingresos: data.reduce((sum, item) => sum + parseFloat(item.total_ingresos), 0),
          total_isv: data.reduce((sum, item) => sum + parseFloat(item.isv_total), 0)
        }
      };
    } catch (error) {
      console.error('Error en getIngresos:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getPorMecanico(fechaInicio, fechaFin) {
    try {
      if (!fechaInicio || !fechaFin) {
        fechaInicio = new Date(new Date().getFullYear(), 0, 1);
        fechaFin = new Date();
      }
      const data = await this.repository.getPorMecanico(fechaInicio, fechaFin);
      return {
        success: true,
        data,
        meta: {
          total_mecanicos: data.length,
          total_ordenes: data.reduce((sum, item) => sum + parseInt(item.total_ordenes), 0),
          total_ingresos: data.reduce((sum, item) => sum + parseFloat(item.ingresos_generados), 0)
        }
      };
    } catch (error) {
      console.error('Error en getPorMecanico:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getOrdenesPendientes(estado = '') {
    try {
      let data;
      if (estado) {
        data = await this.repository.getOrdenesPendientesFiltradas(estado);
      } else {
        data = await this.repository.getOrdenesPendientes();
      }
      return {
        success: true,
        data,
        meta: {
          total: data.length,
          por_estado: {
            recibido: data.filter(item => item.estado === 'recibido').length,
            en_reparacion: data.filter(item => item.estado === 'en reparacion').length,
            listo: data.filter(item => item.estado === 'listo').length
          },
          antiguedad_promedio: data.length > 0 
            ? data.reduce((sum, item) => sum + parseInt(item.dias_antiguedad), 0) / data.length 
            : 0
        }
      };
    } catch (error) {
      console.error('Error en getOrdenesPendientes:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getDashboard() {
    try {
      const data = await this.repository.getDashboard();
      return { success: true, data };
    } catch (error) {
      console.error('Error en getDashboard:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new ReporteService();