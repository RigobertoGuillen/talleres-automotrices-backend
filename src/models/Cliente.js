const pool = require('../config/db');

class Cliente {

  static async findAll() {
    const result = await pool.query(
      `
      SELECT
        c.*,
        (
          SELECT COUNT(*)
          FROM vehiculos v
          WHERE v.cliente_id = c.id
        ) AS total_vehiculos
      FROM clientes c
      ORDER BY c.id
      `
    );

    return result.rows;
  }

  static async findById(id) {
    if (!id) return null;

    const result = await pool.query(
      `
      SELECT
        c.*,
        (
          SELECT json_agg(v)
          FROM vehiculos v
          WHERE v.cliente_id = c.id
        ) AS vehiculos
      FROM clientes c
      WHERE c.id = $1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByNombre(nombre) {
    const result = await pool.query(
      `
      SELECT *
      FROM clientes
      WHERE nombre ILIKE $1
      ORDER BY id
      `,
      [`%${nombre}%`]
    );

    return result.rows;
  }

  static async create({
    nombre,
    telefono,
    correo,
    direccion
  }) {

    const result = await pool.query(
      `
      INSERT INTO clientes
      (
        nombre,
        telefono,
        correo,
        direccion
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING *
      `,
      [
        nombre,
        telefono,
        correo || null,
        direccion || null
      ]
    );

    return result.rows[0];
  }

  static async update(id, data) {

    const cliente = await this.findById(id);

    if (!cliente) return null;

    const result = await pool.query(
      `
      UPDATE clientes
      SET
        nombre = COALESCE($1,nombre),
        telefono = COALESCE($2,telefono),
        correo = COALESCE($3,correo),
        direccion = COALESCE($4,direccion),
        fecha_edicion = NOW()
      WHERE id = $5
      RETURNING *
      `,
      [
        data.nombre,
        data.telefono,
        data.correo,
        data.direccion,
        id
      ]
    );

    return result.rows[0];
  }

  static async registrarAuditoria({
    cliente_id,
    campo_modificado,
    valor_anterior,
    valor_nuevo
  }) {

    try {

      const result = await pool.query(
        `
        INSERT INTO auditoria_clientes
        (
          cliente_id,
          campo_modificado,
          valor_anterior,
          valor_nuevo
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING *
        `,
        [
          cliente_id,
          campo_modificado,
          valor_anterior,
          valor_nuevo
        ]
      );

      return result.rows[0];

    } catch {

      return null;

    }

  }

  static async delete(id) {

    const check = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM vehiculos v
      INNER JOIN ordenes_trabajo o
      ON o.vehiculo_id = v.id
      WHERE v.cliente_id = $1
      `,
      [id]
    );

    if (check.rows[0].total > 0) {
      throw new Error('No se puede eliminar un cliente con órdenes de trabajo activas');
    }

    const result = await pool.query(
      `
      DELETE FROM clientes
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    return result.rows[0] || null;
  }

}

module.exports = Cliente;