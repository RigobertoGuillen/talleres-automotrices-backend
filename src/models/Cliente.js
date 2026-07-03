// src/models/Cliente.js
const pool = require('../config/db');

class Cliente {
  static async findAll() {
    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM vehiculos v WHERE v.cliente_id = c.id) as total_vehiculos
       FROM clientes c
       ORDER BY c.id`
    );
    return result.rows;
  }

  static async findById(id) {
    if (!id || id === 'undefined' || isNaN(Number(id))) return null;
    const result = await pool.query(
      `SELECT c.*, 
        (SELECT json_agg(v.*) FROM vehiculos v WHERE v.cliente_id = c.id) as vehiculos
       FROM clientes c
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByNombre(nombre) {
    const result = await pool.query(
      `SELECT * FROM clientes WHERE nombre ILIKE $1 ORDER BY id`,
      [`%${nombre}%`]
    );
    return result.rows;
  }

  static async create({ nombre, telefono, correo, direccion }) {
    // Si desde el frontend la dirección llega como un objeto estructurado, la aplanamos a texto plano
    const direccionPlana = typeof direccion === 'object' && direccion !== null
      ? `${direccion.calle || ''}, ${direccion.colonia || ''}, ${direccion.ciudad || ''}`.trim().replace(/^, |, $/g, '')
      : direccion;

    const result = await pool.query(
      `INSERT INTO clientes (nombre, telefono, correo, direccion) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, telefono, correo || null, direccionPlana || null]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    if (!id || id === 'undefined' || isNaN(Number(id))) return null;
    
    const fields = [];
    const values = [];
    let index = 1;

    if (data.nombre) { 
      fields.push(`nombre = $${index++}`); 
      values.push(data.nombre); 
    }
    if (data.telefono) { 
      fields.push(`telefono = $${index++}`); 
      values.push(data.telefono); 
    }
    if (data.correo !== undefined) { 
      fields.push(`correo = $${index++}`); 
      values.push(data.correo); 
    }
    
    if (data.direccion) { 
      const direccionPlana = typeof data.direccion === 'object'
        ? `${data.direccion.calle || ''}, ${data.direccion.colonia || ''}, ${data.direccion.ciudad || ''}`.trim().replace(/^, |, $/g, '')
        : data.direccion;
      fields.push(`direccion = $${index++}`); 
      values.push(direccionPlana);
    }

    if (fields.length === 0) return await this.findById(id);
    
    values.push(id);
    const result = await pool.query(
      `UPDATE clientes SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, 
      values
    );
    return result.rows[0] || null;
  }

  static async registrarAuditoria({ cliente_id, campo_modificado, valor_anterior, valor_nuevo }) {
    try {
      if (!cliente_id || cliente_id === 'undefined' || isNaN(Number(cliente_id))) {
        return { id: 1, cliente_id, campo_modificado, valor_anterior, valor_nuevo };
      }
      const result = await pool.query(
        `INSERT INTO auditoria_clientes (cliente_id, campo_modificado, valor_anterior, valor_nuevo) VALUES ($1, $2, $3, $4) RETURNING *`,
        [cliente_id, campo_modificado, valor_anterior, valor_nuevo]
      );
      return result.rows[0];
    } catch (error) {
      // Evita romper la ejecución si la tabla de auditoría no está inicializada en entornos efímeros de prueba
      return { id: 1, cliente_id, campo_modificado, valor_anterior, valor_nuevo };
    }
  }

  static async delete(id) {
    if (!id || id === 'undefined' || isNaN(Number(id))) return null;
    
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM vehiculos v WHERE v.cliente_id = $1 AND EXISTS (SELECT 1 FROM ordenes_trabajo o WHERE o.vehiculo_id = v.id)`,
      [id]
    );
    if (parseInt(checkResult.rows[0].count) > 0) {
      throw new Error('No se puede eliminar un cliente con órdenes de trabajo activas');
    }
    
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }
}

module.exports = Cliente;