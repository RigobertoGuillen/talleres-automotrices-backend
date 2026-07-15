const db = require('../config/db');
const QUERIES = require('../constants/queries/diagnosticoQueries');

class Diagnostico {
  static async ordenExiste(ordenId) {
    const result = await db.query(QUERIES.CHECK_ORDEN, [ordenId]);
    return !!result.rows[0];
  }

  static async findAll({ estado, q, orden_id, orden = 'desc' } = {}) {
    let query = QUERIES.FIND_ALL;
    const condiciones = [];
    const values = [];
    let index = 1;

    if (estado) {
      condiciones.push(`d.estado = $${index++}`);
      values.push(estado);
    }
    if (orden_id) {
      condiciones.push(`d.orden_id = $${index++}`);
      values.push(orden_id);
    }
    if (q) {
      condiciones.push(`(
        d.descripcion_falla ILIKE $${index}
        OR d.observaciones ILIKE $${index}
        OR d.recomendaciones ILIKE $${index}
      )`);
      values.push(`%${q}%`);
      index++;
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const direccion = orden.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    query = `${query} ${where} ORDER BY d.fecha_registro ${direccion}`;
    const result = await db.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(QUERIES.FIND_BY_ID, [id]);
    return result.rows[0] || null;
  }

  static async findByOrden(ordenId) {
    const result = await db.query(QUERIES.FIND_BY_ORDEN, [ordenId]);
    return result.rows;
  }

  static async create({ orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id }) {
    const result = await db.query(QUERIES.CREATE, [
      orden_id,
      descripcion_falla,
      observaciones || null,
      recomendaciones || null,
      estado || null,
      mecanico_id || null
    ]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { descripcion_falla, recomendaciones, observaciones } = data;
    const result = await db.query(QUERIES.UPDATE, [
      descripcion_falla,
      recomendaciones,
      observaciones,
      id
    ]);
    return result.rows[0] || null;
  }

  static async updateObservaciones(id, observaciones) {
    const result = await db.query(QUERIES.UPDATE_OBSERVACIONES, [observaciones, id]);
    return result.rows[0] || null;
  }

  static async updateEstado(id, estado) {
    const result = await db.query(QUERIES.UPDATE_ESTADO, [estado, id]);
    return result.rows[0] || null;
  }
}

module.exports = Diagnostico;