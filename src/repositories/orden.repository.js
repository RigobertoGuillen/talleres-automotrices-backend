const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/ordenQueries');

class OrdenRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  async findById(numero_orden) {
    const result = await this.query(this.queries.FIND_BY_ID, [numero_orden]);
    return result.rows[0] || null;
  }

  async findAll(filtros = {}) {
    let query = this.queries.FIND_ALL_BASE;
    const values = [];
    let index = 1;

    if (filtros.estado) {
      query += ` AND o.estado = $${index++}`;
      values.push(filtros.estado);
    }
    if (filtros.mecanico_id) {
      query += ` AND o.mecanico_id = $${index++}`;
      values.push(filtros.mecanico_id);
    }
    if (filtros.cliente_id) {
      query += ` AND v.cliente_id = $${index++}`;
      values.push(filtros.cliente_id);
    }
    if (filtros.fecha_inicio) {
      query += ` AND o.fecha_ingreso >= $${index++}`;
      values.push(filtros.fecha_inicio);
    }
    if (filtros.fecha_fin) {
      query += ` AND o.fecha_ingreso <= $${index++}`;
      values.push(filtros.fecha_fin);
    }

    query += ` ORDER BY o.fecha_ingreso DESC`;
    const result = await this.query(query, values);
    return result.rows;
  }

  async create(ordenData) {
    const { vehiculo_id, descripcion_problema, prioridad = 0 } = ordenData;
    const result = await this.query(this.queries.CREATE, [vehiculo_id, descripcion_problema, prioridad]);
    return result.rows[0] || null;
  }

  async asignarMecanico(numero_orden, mecanico_id) {
    const result = await this.query(this.queries.ASIGNAR_MECANICO, [mecanico_id, numero_orden]);
    return result.rows[0] || null;
  }

  async actualizarEstado(numero_orden, estado) {
    const result = await this.query(this.queries.ACTUALIZAR_ESTADO, [estado, numero_orden]);
    return result.rows[0] || null;
  }

  async insertHistorial(historialData) {
    const { orden_id, estado, notas, usuario_id } = historialData;
    const result = await this.query(this.queries.INSERT_HISTORIAL, [orden_id, estado, notas, usuario_id]);
    return result.rows[0] || null;
  }

  async cerrar(numero_orden) {
    const result = await this.query(this.queries.CERRAR, [numero_orden]);
    return result.rows[0] || null;
  }

  async reasignar(numero_orden, mecanico_id) {
    const result = await this.query(this.queries.REASIGNAR, [mecanico_id, numero_orden]);
    return result.rows[0] || null;
  }

  async findByMecanico(mecanico_id) {
    const result = await this.query(this.queries.FIND_BY_MECANICO, [mecanico_id]);
    return result.rows;
  }

  async checkVehiculo(vehiculo_id) {
    const result = await this.query(this.queries.CHECK_VEHICULO, [vehiculo_id]);
    return result.rows[0] || null;
  }
}

module.exports = new OrdenRepository();