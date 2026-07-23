const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/reporteQueries');

class ReporteRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  async getServiciosRealizados(fechaInicio, fechaFin) {
    return this.findAll(this.queries.REPORTE_SERVICIOS, [fechaInicio, fechaFin]);
  }

  async getVehiculosAtendidos(fechaInicio, fechaFin) {
    return this.findAll(this.queries.REPORTE_VEHICULOS_ATENDIDOS, [fechaInicio, fechaFin]);
  }

  async getRepuestosUtilizados(fechaInicio, fechaFin) {
    return this.findAll(this.queries.REPORTE_REPUESTOS_UTILIZADOS, [fechaInicio, fechaFin]);
  }

  async getIngresos(fechaInicio, fechaFin) {
    return this.findAll(this.queries.REPORTE_INGRESOS, [fechaInicio, fechaFin]);
  }

  async getPorMecanico(fechaInicio, fechaFin) {
    return this.findAll(this.queries.REPORTE_POR_MECANICO, [fechaInicio, fechaFin]);
  }

  async getOrdenesPendientes() {
    return this.findAll(this.queries.REPORTE_ORDENES_PENDIENTES);
  }

  async getOrdenesPendientesFiltradas(estado) {
    return this.findAll(this.queries.ORDENES_PENDIENTES_FILTRADAS, [estado]);
  }

  async getDashboard() {
    const result = await this.query(this.queries.DASHBOARD_GENERAL);
    return result.rows[0] || null;
  }
}

module.exports = new ReporteRepository();