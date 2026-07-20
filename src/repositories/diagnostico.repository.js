const BaseRepository = require('./base.repository');
const pool = require('../config/db');

class DiagnosticoRepository extends BaseRepository {
  constructor() {
    super(pool);
  }

  async ordenExiste(numero_orden) {
    const sql = `SELECT numero_orden FROM ordenes_trabajo WHERE numero_orden = $1`;
    const result = await this.query(sql, [numero_orden]);
    return result.rows.length > 0;
  }

  async findAll({ estado, q, orden_id, orden = 'desc' } = {}) {
    let sql = `
      SELECT
        d.*,
        u.nombre_completo AS mecanico
      FROM diagnosticos d
      LEFT JOIN usuarios u ON d.mecanico_id = u.id
    `;
    
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

    sql = `${sql} ${where} ORDER BY d.fecha_registro ${direccion}`;
    
    const result = await this.query(sql, values);
    return result.rows;
  }

  async findById(id) {
    const sql = `
      SELECT
        d.*,
        u.nombre_completo AS mecanico
      FROM diagnosticos d
      LEFT JOIN usuarios u ON d.mecanico_id = u.id
      WHERE d.id = $1
    `;
    const result = await this.query(sql, [id]);
    return result.rows[0] || null;
  }

  async findByOrden(numero_orden) {
    const sql = `
      SELECT
        d.*,
        u.nombre_completo AS mecanico
      FROM diagnosticos d
      LEFT JOIN usuarios u ON d.mecanico_id = u.id
      WHERE d.orden_id = $1
      ORDER BY d.fecha_registro DESC
    `;
    const result = await this.query(sql, [numero_orden]);
    return result.rows;
  }

  async create(data) {
    const { orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id } = data;
    const sql = `
      INSERT INTO diagnosticos
        (orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id)
      VALUES ($1, $2, $3, $4, CAST($5 AS estado_diagnostico), $6)
      RETURNING *
    `;
    const result = await this.query(sql, [
      orden_id,
      descripcion_falla,
      observaciones || null,
      recomendaciones || null,
      estado || null,
      mecanico_id || null
    ]);
    return result.rows[0] || null;
  }

  async update(id, data) {
    const { descripcion_falla, recomendaciones, observaciones } = data;
    
    // Validar que descripcion_falla no sea null
    if (descripcion_falla === null || descripcion_falla === undefined || descripcion_falla === '') {
      const diagnosticoExistente = await this.findById(id);
      if (diagnosticoExistente) {
        throw new Error('La descripción de la falla no puede estar vacía');
      }
      return null;
    }

    const sql = `
      UPDATE diagnosticos
      SET descripcion_falla = $1,
          recomendaciones = COALESCE($2, recomendaciones),
          observaciones = COALESCE($3, observaciones),
          fecha_actualizacion = now()
      WHERE id = $4
      RETURNING *
    `;
    const result = await this.query(sql, [
      descripcion_falla,
      recomendaciones || null,
      observaciones || null,
      id
    ]);
    return result.rows[0] || null;
  }

  async updateObservaciones(id, observaciones) {
    const sql = `
      UPDATE diagnosticos
      SET observaciones = $1, fecha_actualizacion = now()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.query(sql, [observaciones, id]);
    return result.rows[0] || null;
  }

  async updateEstado(id, estado) {
    const sql = `
      UPDATE diagnosticos
      SET estado = CAST($1 AS estado_diagnostico), fecha_actualizacion = now()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.query(sql, [estado, id]);
    return result.rows[0] || null;
  }
}

module.exports = new DiagnosticoRepository();