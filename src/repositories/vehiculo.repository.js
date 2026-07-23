const BaseRepository = require('./base.repository');
const pool = require('../config/db');

class VehiculoRepository extends BaseRepository {
  constructor() {
    super(pool);
  }

  async findAll() {
    const sql = `
      SELECT v.id, v.placa, m.id AS marca_id, m.nombre AS marca,
             v.modelo, v.anio, v.color, v.tipo, v.cliente_id, v.fecha_registro
      FROM vehiculos v
      JOIN marcas_vehiculo m ON v.marca_id = m.id
      ORDER BY v.id
    `;
    const result = await this.query(sql);
    return result.rows;
  }

  async findById(id) {
    const sql = `
      SELECT v.*, m.nombre AS marca
      FROM vehiculos v
      JOIN marcas_vehiculo m ON v.marca_id = m.id
      WHERE v.id = $1
    `;
    const result = await this.query(sql, [id]);
    return result.rows[0] || null;
  }

  async findByPlaca(placa) {
    const sql = `
      SELECT v.*, m.nombre AS marca
      FROM vehiculos v
      JOIN marcas_vehiculo m ON v.marca_id = m.id
      WHERE v.placa = $1
    `;
    const result = await this.query(sql, [placa]);
    return result.rows[0] || null;
  }

  async create(data) {
    const { placa, marca_id, modelo, anio, color, tipo, cliente_id } = data;
    const sql = `
      INSERT INTO vehiculos (placa, marca_id, modelo, anio, color, tipo, cliente_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await this.query(sql, [
      placa, marca_id, modelo, anio, color, tipo, cliente_id
    ]);
    return result.rows[0] || null;
  }

  async update(id, data) {
    const { placa, marca_id, modelo, anio, color, tipo, cliente_id } = data;
    const sql = `
      UPDATE vehiculos
      SET placa = $1, marca_id = $2, modelo = $3, anio = $4, color = $5, tipo = $6, cliente_id = $7
      WHERE id = $8
      RETURNING *
    `;
    const result = await this.query(sql, [
      placa, marca_id, modelo, anio, color, tipo, cliente_id, id
    ]);
    return result.rows[0] || null;
  }

  async buscar(query) {
    const sql = `
      SELECT v.id, v.placa, m.id AS marca_id, m.nombre AS marca,
             v.modelo, v.anio, v.color, v.tipo, v.cliente_id, v.fecha_registro
      FROM vehiculos v
      JOIN marcas_vehiculo m ON v.marca_id = m.id
      WHERE v.placa ILIKE $1 OR m.nombre ILIKE $1 OR v.modelo ILIKE $1
      ORDER BY v.id
    `;
    const result = await this.query(sql, [`%${query}%`]);
    return result.rows;
  }

  async findByCliente(clienteId) {
    const sql = `
      SELECT
        v.id, v.placa, m.nombre AS marca, v.modelo, v.anio
      FROM vehiculos v
      INNER JOIN marcas_vehiculo m ON v.marca_id = m.id
      WHERE v.cliente_id = $1
      ORDER BY v.placa
    `;
    const result = await this.query(sql, [clienteId]);
    return result.rows;
  }

  async historial(vehiculoId) {
    const sql = `
      SELECT 
        o.*,
        u.nombre_completo AS mecanico_nombre
      FROM ordenes_trabajo o
      LEFT JOIN usuarios u ON o.mecanico_id = u.id
      WHERE o.vehiculo_id = $1
      ORDER BY o.fecha_ingreso DESC
    `;
    const result = await this.query(sql, [vehiculoId]);
    return result.rows;
  }

  async findAllMarcas() {
    const sql = `SELECT id, nombre FROM marcas_vehiculo ORDER BY nombre`;
    const result = await this.query(sql);
    return result.rows;
  }
}

module.exports = new VehiculoRepository();