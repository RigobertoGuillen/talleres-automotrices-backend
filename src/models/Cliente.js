const db = require('../config/db');
const QUERIES = require('../constants/queries/clienteQueries');

class Cliente {
  static async findAll() {
    const result = await db.query(QUERIES.FIND_ALL);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(QUERIES.FIND_BY_ID, [id]);
    return result.rows[0] || null;
  }

  static async findByDni(dni) {
    const result = await db.query(QUERIES.FIND_BY_DNI, [dni]);
    return result.rows[0] || null;
  }

  static async findByNombre(nombre) {
    const result = await db.query(QUERIES.FIND_BY_NOMBRE, [`%${nombre}%`]);
    return result.rows;
  }

  static async createDireccion({ calle, colonia, ciudad, departamento, referencia }) {
    const result = await db.query(QUERIES.CREATE_DIRECCION, [
      calle, colonia, ciudad, departamento, referencia || null
    ]);
    return result.rows[0].id;
  }

  static async create({ dni, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo, direccion }) {
    let direccionId = null;
    if (direccion) {
      direccionId = await this.createDireccion(direccion);
    }

    const result = await db.query(QUERIES.CREATE, [
      dni, primer_nombre, segundo_nombre || null, primer_apellido, 
      segundo_apellido, telefono, correo || null, direccionId
    ]);
    return result.rows[0];
  }

  static async update(id, data) {
    const cliente = await this.findById(id);
    if (!cliente) return null;

    if (data.direccion) {
      if (cliente.direccion_id) {
        await db.query(QUERIES.UPDATE_DIRECCION, [
          data.direccion.calle, data.direccion.colonia, data.direccion.ciudad,
          data.direccion.departamento, data.direccion.referencia || null, cliente.direccion_id
        ]);
      } else {
        const direccionId = await this.createDireccion(data.direccion);
        data.direccion_id = direccionId;
      }
    }

    const result = await db.query(QUERIES.UPDATE, [
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

  static async registrarAuditoria({ cliente_id, campo_modificado, valor_anterior, valor_nuevo }) {
    const result = await db.query(QUERIES.REGISTRAR_AUDITORIA, [
      cliente_id, campo_modificado, valor_anterior, valor_nuevo
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const checkResult = await db.query(QUERIES.CHECK_ORDENES, [id]);
    const tieneOrdenes = parseInt(checkResult.rows[0].count) > 0;
    if (tieneOrdenes) {
      throw new Error('No se puede eliminar un cliente con órdenes de trabajo asociadas');
    }

    const result = await db.query(QUERIES.DELETE, [id]);
    return result.rows[0] || null;
  }

  static async getHistorial(id, fecha_inicio, fecha_fin) {
    let query = QUERIES.GET_HISTORIAL_BASE;
    const params = [id];
    let index = 2;

    if (fecha_inicio) {
      query += ` AND o.fecha_ingreso >= $${index++}`;
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      query += ` AND o.fecha_ingreso <= $${index++}`;
      params.push(fecha_fin);
    }

    query += ` ORDER BY o.fecha_ingreso DESC`;
    const result = await db.query(query, params);
    return result.rows;
  }
}

module.exports = Cliente;