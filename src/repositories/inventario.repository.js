const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/inventarioQueries');

class InventarioRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  async categoriaFindAll() {
    return this.findAll(this.queries.CATEGORIA_FIND_ALL);
  }

  async categoriaFindById(id) {
    return this.findOne(this.queries.CATEGORIA_FIND_BY_ID, [id]);
  }

  async categoriaCreate(data) {
    return this.execute(this.queries.CATEGORIA_CREATE, [data.nombre]);
  }

  async categoriaUpdate(id, data) {
    return this.execute(this.queries.CATEGORIA_UPDATE, [data.nombre, id]);
  }

  async categoriaDelete(id) {
    return this.execute(this.queries.CATEGORIA_DELETE, [id]);
  }

  async categoriaCheckRepuestos(id) {
    const result = await this.findOne(this.queries.CATEGORIA_CHECK_REPUESTOS, [id]);
    return parseInt(result?.count || 0) > 0;
  }

  async repuestoFindAll() {
    return this.findAll(this.queries.REPUESTO_FIND_ALL);
  }

  async repuestoFindById(id) {
    return this.findOne(this.queries.REPUESTO_FIND_BY_ID, [id]);
  }

  async repuestoFindByCodigo(codigo) {
    return this.findOne(this.queries.REPUESTO_FIND_BY_CODIGO, [codigo]);
  }

  async repuestoBuscar(query) {
    return this.findAll(this.queries.REPUESTO_BUSCAR, [`%${query}%`]);
  }

  async repuestoCreate(data) {
    return this.execute(this.queries.REPUESTO_CREATE, [
      data.codigo, data.nombre, data.categoria_id,
      data.costo_unitario, data.precio_unitario
    ]);
  }

  async repuestoUpdate(id, data) {
    return this.execute(this.queries.REPUESTO_UPDATE, [
      data.codigo, data.nombre, data.categoria_id,
      data.costo_unitario, data.precio_unitario, id
    ]);
  }

  async repuestoDelete(id) {
    return this.execute(this.queries.REPUESTO_DELETE, [id]);
  }

  async repuestoCheckStock(id) {
    const result = await this.findOne(this.queries.REPUESTO_CHECK_STOCK, [id]);
    return parseInt(result?.count || 0) > 0;
  }

  async repuestoCheckMovimientos(id) {
    const result = await this.findOne(this.queries.REPUESTO_CHECK_MOVIMIENTOS, [id]);
    return parseInt(result?.count || 0) > 0;
  }

  async stockFindByRepuesto(repuestoId) {
    return this.findOne(this.queries.STOCK_FIND_BY_REPUESTO, [repuestoId]);
  }

  async stockCreate(data) {
    return this.execute(this.queries.STOCK_CREATE, [
      data.repuesto_id, data.cantidad_disponible || 0, data.cantidad_minima || 0
    ]);
  }

  async stockUpdate(repuestoId, data) {
    return this.execute(this.queries.STOCK_UPDATE, [
      data.cantidad_disponible, data.cantidad_minima, repuestoId
    ]);
  }

  async stockActualizarCantidad(repuestoId, cantidad) {
    return this.execute(this.queries.STOCK_ACTUALIZAR_CANTIDAD, [cantidad, repuestoId]);
  }

  async stockGetBajo() {
    return this.findAll(this.queries.STOCK_BAJO);
  }

  async movimientoFindAll(limit = 100, offset = 0) {
    return this.findAll(this.queries.MOVIMIENTO_FIND_ALL, [limit, offset]);
  }

  async movimientoFindByRepuesto(repuestoId) {
    return this.findAll(this.queries.MOVIMIENTO_FIND_BY_REPUESTO, [repuestoId]);
  }

  async movimientoCreate(data) {
    return this.execute(this.queries.MOVIMIENTO_CREATE, [
      data.repuesto_id, data.tipo_movimiento, data.cantidad,
      data.motivo, data.orden_id || null, data.usuario_id || null
    ]);
  }

  async movimientoReporte(fechaInicio, fechaFin) {
    return this.findAll(this.queries.MOVIMIENTO_REPORTE, [fechaInicio, fechaFin]);
  }

  async solicitudFindAll() {
    return this.findAll(this.queries.SOLICITUD_FIND_ALL);
  }

  async solicitudFindPendientes() {
    return this.findAll(this.queries.SOLICITUD_FIND_PENDIENTES);
  }

  async solicitudCreate(data) {
    return this.execute(this.queries.SOLICITUD_CREATE, [
      data.orden_id, data.repuesto_id, data.cantidad_solicitada,
      data.costo_historico, data.precio_historico, data.mecanico_id
    ]);
  }

  async solicitudAprobar(id, estado, aprobado_por) {
    return this.execute(this.queries.SOLICITUD_APROBAR, [estado, aprobado_por, id]);
  }

  async solicitudFindById(id) {
    const sql = `
      SELECT s.*, r.nombre AS repuesto_nombre
      FROM solicitudes_repuestos s
      JOIN repuestos r ON s.repuesto_id = r.id
      WHERE s.id = $1
    `;
    const result = await this.query(sql, [id]);
    return result.rows[0] || null;
  }

  async solicitudFindByOrden(ordenId) {
    return this.findAll(this.queries.SOLICITUD_FIND_BY_ORDEN, [ordenId]);
  }
}

module.exports = new InventarioRepository();