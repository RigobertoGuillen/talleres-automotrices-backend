const BaseService = require('./base.service');
const ReportesRepository = require('../repositories/reporte.repository');

function validarRangoFechas(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    return 'Debe indicar fecha de inicio y fecha de fin';
  }
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return 'Las fechas indicadas no son válidas';
  }
  if (inicio > fin) {
    return 'La fecha de inicio no puede ser posterior a la fecha de fin';
  }
  return null;
}

class ReportesService extends BaseService {
  constructor() {
    super(ReportesRepository);
  }

  // HU-39: Reporte de servicios realizados
  async reporteServicios(fechaInicio, fechaFin) {
    try {
      const errorFechas = validarRangoFechas(fechaInicio, fechaFin);
      if (errorFechas) return { success: false, message: errorFechas };

      const [detalle, resumen] = await Promise.all([
        this.repository.serviciosDetalle(fechaInicio, fechaFin),
        this.repository.serviciosResumen(fechaInicio, fechaFin),
      ]);

      return {
        success: true,
        data: {
          detalle,
          resumen,
          cantidad_total: detalle.length,
        }
      };
    } catch (error) {
      console.error('Error en reporteServicios:', error.message);
      return { success: false, message: 'Error al generar el reporte de servicios' };
    }
  }

  // HU-40: Reporte de vehículos atendidos
  async reporteVehiculosAtendidos(fechaInicio, fechaFin) {
    try {
      const errorFechas = validarRangoFechas(fechaInicio, fechaFin);
      if (errorFechas) return { success: false, message: errorFechas };

      const [detalle, porTipo] = await Promise.all([
        this.repository.vehiculosAtendidosDetalle(fechaInicio, fechaFin),
        this.repository.vehiculosAtendidosPorTipo(fechaInicio, fechaFin),
      ]);

      return {
        success: true,
        data: {
          periodo: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
          detalle,
          por_tipo: porTipo,
          cantidad_vehiculos: detalle.length,
        }
      };
    } catch (error) {
      console.error('Error en reporteVehiculosAtendidos:', error.message);
      return { success: false, message: 'Error al generar el reporte de vehículos atendidos' };
    }
  }

  // HU-41: Reporte de inventario utilizado
  async reporteInventarioUtilizado(fechaInicio, fechaFin) {
    try {
      const errorFechas = validarRangoFechas(fechaInicio, fechaFin);
      if (errorFechas) return { success: false, message: errorFechas };

      const [detalle, resumen] = await Promise.all([
        this.repository.inventarioUtilizadoDetalle(fechaInicio, fechaFin),
        this.repository.inventarioUtilizadoResumen(fechaInicio, fechaFin),
      ]);

      return { success: true, data: { detalle, resumen } };
    } catch (error) {
      console.error('Error en reporteInventarioUtilizado:', error.message);
      return { success: false, message: 'Error al generar el reporte de inventario utilizado' };
    }
  }

  // HU-42: Reporte de ingresos
  async reporteIngresos(fechaInicio, fechaFin) {
    try {
      const errorFechas = validarRangoFechas(fechaInicio, fechaFin);
      if (errorFechas) return { success: false, message: errorFechas };

      const [porDia, totales, porMetodoPago] = await Promise.all([
        this.repository.ingresosPorDia(fechaInicio, fechaFin),
        this.repository.ingresosTotales(fechaInicio, fechaFin),
        this.repository.ingresosPorMetodoPago(fechaInicio, fechaFin),
      ]);

      return {
        success: true,
        data: {
          por_dia: porDia,
          totales,
          por_metodo_pago: porMetodoPago,
        }
      };
    } catch (error) {
      console.error('Error en reporteIngresos:', error.message);
      return { success: false, message: 'Error al generar el reporte de ingresos' };
    }
  }

  // HU-43: Reporte por mecánico
  async reporteMecanicos(fechaInicio, fechaFin, mecanicoId) {
    try {
      const errorFechas = validarRangoFechas(fechaInicio, fechaFin);
      if (errorFechas) return { success: false, message: errorFechas };

      const resultado = await this.repository.reporteMecanicos(
        fechaInicio, fechaFin, mecanicoId ? parseInt(mecanicoId) : null
      );

      return { success: true, data: resultado };
    } catch (error) {
      console.error('Error en reporteMecanicos:', error.message);
      return { success: false, message: 'Error al generar el reporte por mecánico' };
    }
  }

  async listarMecanicosActivos() {
    try {
      const mecanicos = await this.repository.mecanicosActivos();
      return { success: true, data: mecanicos };
    } catch (error) {
      console.error('Error en listarMecanicosActivos:', error.message);
      return { success: false, message: 'Error al obtener mecánicos' };
    }
  }

  // HU-44: Reporte de órdenes pendientes
  async reporteOrdenesPendientes(filtros = {}) {
    try {
      const { estado, mecanico_id, antiguedad_minima } = filtros;
      const antiguedad = parseInt(antiguedad_minima) || 0;
      if (antiguedad < 0) {
        return { success: false, message: 'La antigüedad mínima no puede ser negativa' };
      }

      const resultado = await this.repository.ordenesPendientes(
        estado || null,
        mecanico_id ? parseInt(mecanico_id) : null,
        antiguedad
      );

      return { success: true, data: resultado };
    } catch (error) {
      console.error('Error en reporteOrdenesPendientes:', error.message);
      return { success: false, message: 'Error al generar el reporte de órdenes pendientes' };
    }
  }

  // HU-45: Dashboard general (admin + recepcionista)
  async dashboardGeneral() {
    try {
      const [
        ordenesProgreso, ordenesActivas, vehiculosListos,
        diagnosticosPendientes, alertasInventario,
        totalClientes, ingresosMes
      ] = await Promise.all([
        this.repository.dashboardOrdenesProgreso(),
        this.repository.dashboardOrdenesActivas(),
        this.repository.dashboardVehiculosListos(),
        this.repository.dashboardDiagnosticosPendientes(),
        this.repository.dashboardAlertasInventario(),
        this.repository.dashboardTotalClientes(),
        this.repository.dashboardIngresosMes(),
      ]);

      return {
        success: true,
        ordenesProgreso: parseInt(ordenesProgreso?.total || 0),
        ordenesActivas: parseInt(ordenesActivas?.total || 0),
        vehiculosListos: parseInt(vehiculosListos?.total || 0),
        diagnosticosPendientes: parseInt(diagnosticosPendientes?.total || 0),
        alertasInventario: parseInt(alertasInventario?.total || 0),
        totalClientes: parseInt(totalClientes?.total || 0),
        ingresosMes: parseFloat(ingresosMes?.total || 0),
      };
    } catch (error) {
      console.error('Error en dashboardGeneral:', error.message);
      return { success: false, message: 'Error al obtener los indicadores del dashboard' };
    }
  }
}

module.exports = new ReportesService();
