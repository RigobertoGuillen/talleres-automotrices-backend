const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/reporteQueries');

class ReportesRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  // HU-39
  async serviciosDetalle(fechaInicio, fechaFin) {
    return this.findAll(this.queries.SERVICIOS_DETALLE, [fechaInicio, fechaFin]);
  }
  async serviciosResumen(fechaInicio, fechaFin) {
    return this.findAll(this.queries.SERVICIOS_RESUMEN, [fechaInicio, fechaFin]);
  }

  // HU-40
  async vehiculosAtendidosDetalle(fechaInicio, fechaFin) {
    return this.findAll(this.queries.VEHICULOS_ATENDIDOS_DETALLE, [fechaInicio, fechaFin]);
  }
  async vehiculosAtendidosPorTipo(fechaInicio, fechaFin) {
    return this.findAll(this.queries.VEHICULOS_ATENDIDOS_POR_TIPO, [fechaInicio, fechaFin]);
  }

  // HU-41
  async inventarioUtilizadoDetalle(fechaInicio, fechaFin) {
    return this.findAll(this.queries.INVENTARIO_UTILIZADO_DETALLE, [fechaInicio, fechaFin]);
  }
  async inventarioUtilizadoResumen(fechaInicio, fechaFin) {
    return this.findAll(this.queries.INVENTARIO_UTILIZADO_RESUMEN, [fechaInicio, fechaFin]);
  }

  // HU-42
  async ingresosPorDia(fechaInicio, fechaFin) {
    return this.findAll(this.queries.INGRESOS_POR_DIA, [fechaInicio, fechaFin]);
  }
  async ingresosTotales(fechaInicio, fechaFin) {
    return this.findOne(this.queries.INGRESOS_TOTALES, [fechaInicio, fechaFin]);
  }
  async ingresosPorMetodoPago(fechaInicio, fechaFin) {
    return this.findAll(this.queries.INGRESOS_POR_METODO_PAGO, [fechaInicio, fechaFin]);
  }

  // HU-43
  async mecanicosActivos() {
    return this.findAll(this.queries.MECANICOS_ACTIVOS);
  }
  async reporteMecanicos(fechaInicio, fechaFin, mecanicoId) {
    return this.findAll(this.queries.REPORTE_MECANICOS, [fechaInicio, fechaFin, mecanicoId || null]);
  }

  // HU-44
  async ordenesPendientes(estado, mecanicoId, antiguedadMinima) {
    return this.findAll(this.queries.ORDENES_PENDIENTES, [
      estado || null, mecanicoId || null, antiguedadMinima || 0
    ]);
  }

  // HU-45
  async dashboardOrdenesProgreso() {
    return this.findOne(this.queries.DASHBOARD_ORDENES_PROGRESO);
  }
  async dashboardOrdenesActivas() {
    return this.findOne(this.queries.DASHBOARD_ORDENES_ACTIVAS);
  }
  async dashboardVehiculosListos() {
    return this.findOne(this.queries.DASHBOARD_VEHICULOS_LISTOS);
  }
  async dashboardDiagnosticosPendientes() {
    return this.findOne(this.queries.DASHBOARD_DIAGNOSTICOS_PENDIENTES);
  }
  async dashboardAlertasInventario() {
    return this.findOne(this.queries.DASHBOARD_ALERTAS_INVENTARIO);
  }
  async dashboardTotalClientes() {
    return this.findOne(this.queries.DASHBOARD_TOTAL_CLIENTES);
  }
  async dashboardIngresosMes() {
    return this.findOne(this.queries.DASHBOARD_INGRESOS_MES);
  }
}

module.exports = new ReportesRepository();
