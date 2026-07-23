const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/clienteQueries');

class ClienteRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  async findAll() {
    const result = await this.query(this.queries.FIND_ALL);
    return result.rows;
  }

  async findById(id) {
    const result = await this.query(this.queries.FIND_BY_ID, [id]);
    return result.rows[0] || null;
  }

  async findByDni(dni) {
    const result = await this.query(this.queries.FIND_BY_DNI, [dni]);
    return result.rows[0] || null;
  }

  async findByNombre(nombre) {
    const result = await this.query(this.queries.FIND_BY_NOMBRE, [`%${nombre}%`]);
    return result.rows;
  }

  async create(clienteData) {
    const { 
      dni, primer_nombre, segundo_nombre, primer_apellido, 
      segundo_apellido, telefono, correo, direccion_id 
    } = clienteData;
    const result = await this.query(this.queries.CREATE, [
      dni, primer_nombre, segundo_nombre || null, primer_apellido,
      segundo_apellido, telefono, correo || null, direccion_id || null
    ]);
    return result.rows[0] || null;
  }

  async update(id, data) {
    const result = await this.query(this.queries.UPDATE, [
      data.dni || null,
      data.primer_nombre || null,
      data.segundo_nombre !== undefined ? data.segundo_nombre : null,
      data.primer_apellido || null,
      data.segundo_apellido || null,
      data.telefono || null,
      data.correo !== undefined ? data.correo : null,
      data.direccion_id || null,
      id
    ]);
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await this.query(this.queries.DELETE, [id]);
    return result.rows[0] || null;
  }

  async checkOrdenes(id) {
    const result = await this.query(this.queries.CHECK_ORDENES, [id]);
    return parseInt(result.rows[0]?.count || 0) > 0;
  }

  async registrarAuditoria(auditoriaData) {
    const { cliente_id, campo_modificado, valor_anterior, valor_nuevo } = auditoriaData;
    const result = await this.query(this.queries.REGISTRAR_AUDITORIA, [
      cliente_id, campo_modificado, valor_anterior, valor_nuevo
    ]);
    return result.rows[0] || null;
  }

  async createDireccion(direccionData) {
    const { calle, colonia, ciudad, departamento, referencia } = direccionData;
    const result = await this.query(this.queries.CREATE_DIRECCION, [
      calle, colonia, ciudad, departamento, referencia || null
    ]);
    return result.rows[0]?.id || null;
  }

  async getHistorial(id, fechaInicio, fechaFin) {
    let query = this.queries.GET_HISTORIAL;
    const params = [id];
    let index = 2;

    if (fechaInicio) {
      query += ` AND o.fecha_ingreso >= $${index++}`;
      params.push(fechaInicio);
    }
    if (fechaFin) {
      query += ` AND o.fecha_ingreso <= $${index++}`;
      params.push(fechaFin);
    }

    const result = await this.query(query, params);
    return result.rows;
  }
}

module.exports = new ClienteRepository();