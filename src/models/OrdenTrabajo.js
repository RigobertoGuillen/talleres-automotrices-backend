const db = require('../config/db');
const QUERIES = require('../constants/queries/ordenQueries');

class OrdenTrabajo {
  static async findAll(filtros = {}) {
    let query = QUERIES.FIND_ALL_BASE;
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
    const result = await db.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(QUERIES.FIND_BY_ID, [id]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { vehiculo_id, descripcion_problema, prioridad = 0 } = data;

    const vehiculoResult = await db.query(QUERIES.CHECK_VEHICULO, [vehiculo_id]);
    if (vehiculoResult.rows.length === 0) {
      const error = new Error('Vehículo no encontrado');
      error.code = 'VEHICULO_NO_ENCONTRADO';
      throw error;
    }

    const result = await db.query(QUERIES.CREATE, [
      vehiculo_id, descripcion_problema, prioridad
    ]);
    return result.rows[0];
  }

  static async asignarMecanico(id, mecanico_id) {
    const result = await db.query(QUERIES.ASIGNAR_MECANICO, [mecanico_id, id]);
    return result.rows[0] || null;
  }

  static async actualizarEstado(id, estado, notas = null, usuario_id = null) {
    const result = await db.query(QUERIES.ACTUALIZAR_ESTADO, [estado, id]);

    if (result.rows[0]) {
      await db.query(QUERIES.INSERT_HISTORIAL, [id, estado, notas, usuario_id]);
    }

    return result.rows[0] || null;
  }

  static async cerrar(id, usuario_id = null) {
    const result = await db.query(QUERIES.CERRAR, [id]);

    if (result.rows[0]) {
      await db.query(QUERIES.INSERT_HISTORIAL, [
        id, 'entregado', 'Orden cerrada', usuario_id
      ]);
    }

    return result.rows[0] || null;
  }

  static async reasignar(id, mecanico_id, usuario_id = null) {
    const result = await db.query(QUERIES.REASIGNAR, [mecanico_id, id]);

    if (result.rows[0]) {
      await db.query(QUERIES.INSERT_HISTORIAL, [
        id,
        (await db.query('SELECT estado FROM ordenes_trabajo WHERE id = $1', [id])).rows[0].estado,
        `Reasignado a mecánico ID: ${mecanico_id}`,
        usuario_id
      ]);
    }

    return result.rows[0] || null;
  }

  static async findByMecanico(mecanico_id) {
    const result = await db.query(QUERIES.FIND_BY_MECANICO, [mecanico_id]);
    return result.rows;
  }
}

module.exports = OrdenTrabajo;