const pool = require('../config/db');

class Cliente {
  static async findAll() {
    const result = await pool.query(
      `SELECT c.*, 
        d.calle, d.colonia, d.ciudad, d.departamento, d.referencia,
        (SELECT COUNT(*) FROM vehiculos v WHERE v.cliente_id = c.id) as total_vehiculos
       FROM clientes c
       LEFT JOIN direcciones d ON c.direccion_id = d.id
       ORDER BY c.id`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT c.*, 
        d.calle, d.colonia, d.ciudad, d.departamento, d.referencia,
        (SELECT json_agg(v.*) FROM vehiculos v WHERE v.cliente_id = c.id) as vehiculos
       FROM clientes c
       LEFT JOIN direcciones d ON c.direccion_id = d.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByDni(dni) {
    const result = await pool.query(
      `SELECT c.*, 
        d.calle, d.colonia, d.ciudad, d.departamento, d.referencia
       FROM clientes c
       LEFT JOIN direcciones d ON c.direccion_id = d.id
       WHERE c.dni = $1`,
      [dni]
    );
    return result.rows[0] || null;
  }

  static async findByNombre(nombre) {
    const result = await pool.query(
      `SELECT c.*, 
        d.calle, d.colonia, d.ciudad, d.departamento, d.referencia
       FROM clientes c
       LEFT JOIN direcciones d ON c.direccion_id = d.id
       WHERE c.primer_nombre ILIKE $1 
          OR c.primer_apellido ILIKE $1
          OR CONCAT(c.primer_nombre, ' ', c.primer_apellido) ILIKE $1
       ORDER BY c.id`,
      [`%${nombre}%`]
    );
    return result.rows;
  }

  static async createDireccion({ calle, colonia, ciudad, departamento, referencia }) {
    const result = await pool.query(
      `INSERT INTO direcciones (calle, colonia, ciudad, departamento, referencia) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [calle, colonia, ciudad, departamento, referencia || null]
    );
    return result.rows[0].id;
  }

  static async create({ dni, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo, direccion }) {
    let direccionId = null;
    if (direccion) {
      direccionId = await this.createDireccion(direccion);
    }

    const result = await pool.query(
      `INSERT INTO clientes 
        (dni, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo, direccion_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [dni, primer_nombre, segundo_nombre || null, primer_apellido, segundo_apellido, telefono, correo || null, direccionId]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const cliente = await this.findById(id);
    if (!cliente) return null;

    if (data.direccion) {
      if (cliente.direccion_id) {
        await pool.query(
          `UPDATE direcciones 
           SET calle = $1, colonia = $2, ciudad = $3, departamento = $4, referencia = $5
           WHERE id = $6`,
          [data.direccion.calle, data.direccion.colonia, data.direccion.ciudad, 
           data.direccion.departamento, data.direccion.referencia || null, cliente.direccion_id]
        );
      } else {
        const direccionId = await this.createDireccion(data.direccion);
        data.direccion_id = direccionId;
      }
    }

    const fields = [];
    const values = [];
    let index = 1;

    if (data.dni) { fields.push(`dni = $${index++}`); values.push(data.dni); }
    if (data.primer_nombre) { fields.push(`primer_nombre = $${index++}`); values.push(data.primer_nombre); }
    if (data.segundo_nombre !== undefined) { fields.push(`segundo_nombre = $${index++}`); values.push(data.segundo_nombre); }
    if (data.primer_apellido) { fields.push(`primer_apellido = $${index++}`); values.push(data.primer_apellido); }
    if (data.segundo_apellido) { fields.push(`segundo_apellido = $${index++}`); values.push(data.segundo_apellido); }
    if (data.telefono) { fields.push(`telefono = $${index++}`); values.push(data.telefono); }
    if (data.correo !== undefined) { fields.push(`correo = $${index++}`); values.push(data.correo); }
    if (data.direccion_id) { fields.push(`direccion_id = $${index++}`); values.push(data.direccion_id); }

    values.push(id);

    const result = await pool.query(
      `UPDATE clientes SET ${fields.join(', ')} 
       WHERE id = $${index} 
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async registrarAuditoria({ cliente_id, campo_modificado, valor_anterior, valor_nuevo }) {
    const result = await pool.query(
      `INSERT INTO auditoria_clientes (cliente_id, campo_modificado, valor_anterior, valor_nuevo) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [cliente_id, campo_modificado, valor_anterior, valor_nuevo]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM vehiculos v 
       WHERE v.cliente_id = $1 AND EXISTS (
         SELECT 1 FROM ordenes_trabajo o WHERE o.vehiculo_id = v.id
       )`,
      [id]
    );
    
    const tieneOrdenes = parseInt(checkResult.rows[0].count) > 0;
    if (tieneOrdenes) {
      throw new Error('No se puede eliminar un cliente con ordenes de trabajo asociadas');
    }

    const result = await pool.query(
      'DELETE FROM clientes WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Cliente;