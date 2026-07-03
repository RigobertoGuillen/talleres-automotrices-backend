const pool = require('../config/db');

class OrdenTrabajo {
  static async findAll(filtros = {}) {
    let query = `
      SELECT o.*, 
             v.placa, v.modelo,
             c.nombre as cliente_nombre,
             u.nombre_completo as mecanico_nombre
      FROM ordenes_trabajo o
      JOIN vehiculos v ON o.vehiculo_id = v.id
      JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON o.mecanico_id = u.id
      WHERE 1=1
    `;
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
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT o.*, 
              v.placa, v.modelo, v.marca, v.anio,
              c.id as cliente_id, c.nombre as cliente_nombre, c.telefono,
              u.id as mecanico_id, u.nombre_completo as mecanico_nombre,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', d.id,
                  'descripcion_falla', d.decripcion_falla,
                  'observaciones', d.observaciones,
                  'estado', d.estado
                )) FROM diagnosticos d WHERE d.orden_id = o.id),
                '[]'::json
              ) as diagnosticos,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', h.id,
                  'estado', h.estado,
                  'notas', h.notas,
                  'fecha_hora', h.fecha_hora
                ) ORDER BY h.fecha_hora DESC) 
                FROM historial_estados_orden h WHERE h.orden_id = o.id),
                '[]'::json
              ) as historial_estados
     FROM ordenes_trabajo o
     JOIN vehiculos v ON o.vehiculo_id = v.id
     JOIN clientes c ON v.cliente_id = c.id
     LEFT JOIN usuarios u ON o.mecanico_id = u.id
     WHERE o.id = $1
     GROUP BY o.id, v.id, c.id, u.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { vehiculo_id, descripcion_problema, prioridad = 0 } = data;
    const result = await pool.query(
      `INSERT INTO ordenes_trabajo 
        (vehiculo_id, descripcion_problema, prioridad) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [vehiculo_id, descripcion_problema, prioridad]
    );
    return result.rows[0];
  }

  static async asignarMecanico(id, mecanico_id) {
    const result = await pool.query(
      `UPDATE ordenes_trabajo 
       SET mecanico_id = $1, fecha_actualizacion = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [mecanico_id, id]
    );
    return result.rows[0] || null;
  }

  static async actualizarEstado(id, estado, notas = null, usuario_id = null) {
    const result = await pool.query(
      `UPDATE ordenes_trabajo 
       SET estado = $1, fecha_actualizacion = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [estado, id]
    );

    if (result.rows[0]) {
      await pool.query(
        `INSERT INTO historial_estados_orden (orden_id, estado, notas, usuario_id) 
         VALUES ($1, $2, $3, $4)`,
        [id, estado, notas, usuario_id]
      );
    }

    return result.rows[0] || null;
  }

  static async cerrar(id, usuario_id = null) {
    const result = await pool.query(
      `UPDATE ordenes_trabajo 
       SET estado = 'entregado', fecha_actualizacion = NOW() 
       WHERE id = $1 AND estado != 'entregado'
       RETURNING *`,
      [id]
    );

    if (result.rows[0]) {
      await pool.query(
        `INSERT INTO historial_estados_orden (orden_id, estado, notas, usuario_id) 
         VALUES ($1, 'entregado', 'Orden cerrada', $2)`,
        [id, usuario_id]
      );
    }

    return result.rows[0] || null;
  }

  static async reasignar(id, mecanico_id, usuario_id = null) {
    const result = await pool.query(
      `UPDATE ordenes_trabajo 
       SET mecanico_id = $1, fecha_actualizacion = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [mecanico_id, id]
    );

    if (result.rows[0]) {
      await pool.query(
        `INSERT INTO historial_estados_orden (orden_id, estado, notas, usuario_id) 
         VALUES ($1, (SELECT estado FROM ordenes_trabajo WHERE id = $2), 
                 $3, $4)`,
        [id, id, `Reasignado a mecánico ID: ${mecanico_id}`, usuario_id]
      );
    }

    return result.rows[0] || null;
  }

  static async findByMecanico(mecanico_id) {
    const result = await pool.query(
      `SELECT o.*, 
              v.placa, v.modelo,
              c.nombre as cliente_nombre
       FROM ordenes_trabajo o
       JOIN vehiculos v ON o.vehiculo_id = v.id
       JOIN clientes c ON v.cliente_id = c.id
       WHERE o.mecanico_id = $1
       ORDER BY o.fecha_ingreso DESC`,
      [mecanico_id]
    );
    return result.rows;
  }
}

module.exports = OrdenTrabajo;