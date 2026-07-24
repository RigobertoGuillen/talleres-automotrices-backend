const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/facturacionQueries');

// SRP: esta clase solo sabe hablar con la base de datos de autorizaciones
// CAI y facturación; no valida reglas de negocio (rango del CAI, estado de
// la orden, etc.) ni arma respuestas HTTP, eso vive en
// FacturacionService/controller.
// OCP/LSP: extiende BaseRepository sin modificarlo y puede usarse en
// cualquier lugar donde se espere un BaseRepository (findAll/findOne/execute).
class FacturacionRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  // ── CAI ────────────────────────────────────────────────────────────
  async caiFindAll() {
    return this.findAll(this.queries.CAI_FIND_ALL);
  }

  async caiFindById(id) {
    return this.findOne(this.queries.CAI_FIND_BY_ID, [id]);
  }

  async caiFindByCodigo(cai) {
    return this.findOne(this.queries.CAI_FIND_BY_CODIGO, [cai]);
  }

  async caiFindActivoVigente() {
    return this.findOne(this.queries.CAI_FIND_ACTIVO_VIGENTE);
  }

  async caiCreate(data) {
    return this.execute(this.queries.CAI_CREATE, [
      data.cai, data.punto_emision, data.rango_autorizado_inicio,
      data.rango_autorizado_fin, data.fecha_limite_emision
    ]);
  }

  async caiFindUltimoNumero(caiId) {
    const result = await this.findOne(this.queries.CAI_FIND_ULTIMO_NUMERO, [caiId]);
    return result?.numero_factura || null;
  }

  // ── Orden (datos fiscales) ───────────────────────────────────────────
  async ordenFindParaFactura(ordenId) {
    return this.findOne(this.queries.ORDEN_FIND_PARA_FACTURA, [ordenId]);
  }

  async ordenServiciosParaFacturar(ordenId) {
    return this.findAll(this.queries.ORDEN_SERVICIOS_PARA_FACTURAR, [ordenId]);
  }

  async ordenRepuestosParaFacturar(ordenId) {
    return this.findAll(this.queries.ORDEN_REPUESTOS_PARA_FACTURAR, [ordenId]);
  }

  // ── Facturas ──────────────────────────────────────────────────────────
  async facturaFindAll() {
    return this.findAll(this.queries.FACTURA_FIND_ALL);
  }

  async facturaFindById(id) {
    return this.findOne(this.queries.FACTURA_FIND_BY_ID, [id]);
  }

  async facturaFindByOrden(ordenId) {
    return this.findOne(this.queries.FACTURA_FIND_BY_ORDEN, [ordenId]);
  }

  async facturaCreate(data) {
    return this.execute(this.queries.FACTURA_CREATE, [
      data.orden_id, data.cai_id, data.numero_factura,
      data.cliente_dni, data.cliente_nombre, data.cliente_direccion
    ]);
  }

  async facturaUpdateMetodoPago(id, metodoPago) {
    return this.execute(this.queries.FACTURA_UPDATE_METODO_PAGO, [metodoPago, id]);
  }

  // ── Detalle de factura ────────────────────────────────────────────────
  async facturaDetalleFindByFactura(facturaId) {
    return this.findAll(this.queries.FACTURA_DETALLE_FIND_BY_FACTURA, [facturaId]);
  }

  async facturaDetalleInsertServicio(facturaId, item) {
    return this.execute(this.queries.FACTURA_DETALLE_INSERT_SERVICIO, [
      facturaId, item.orden_servicio_id, item.descripcion, item.cantidad, item.costo_unitario
    ]);
  }

  async facturaDetalleInsertRepuesto(facturaId, item) {
    return this.execute(this.queries.FACTURA_DETALLE_INSERT_REPUESTO, [
      facturaId, item.solicitud_repuesto_id, item.descripcion, item.cantidad, item.costo_unitario
    ]);
  }
}

module.exports = new FacturacionRepository();
