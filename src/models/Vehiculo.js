const db = require('../config/db');
const QUERIES = require('../constants/queries/vehiculoQueries');

class Vehiculo {
  static async findAll() {
    const result = await db.query(QUERIES.FIND_ALL);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(QUERIES.FIND_BY_ID, [id]);
    return result.rows[0] || null;
  }

  static async findByPlaca(placa) {
    const result = await db.query(QUERIES.FIND_BY_PLACA, [placa]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { placa, marca_id, modelo, anio, color, tipo, cliente_id } = data;
    const result = await db.query(QUERIES.CREATE, [
      placa, marca_id, modelo, anio, color, tipo, cliente_id
    ]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { placa, marca_id, modelo, anio, color, tipo, cliente_id } = data;
    const result = await db.query(QUERIES.UPDATE, [
      placa, marca_id, modelo, anio, color, tipo, cliente_id, id
    ]);
    return result.rows[0] || null;
  }

  static async buscar(q) {
    const result = await db.query(QUERIES.BUSCAR, [`%${q}%`]);
    return result.rows;
  }

  static async findByCliente(clienteId) {
    const result = await db.query(QUERIES.FIND_BY_CLIENTE, [clienteId]);
    return result.rows;
  }

  static async historial(vehiculoId) {
    const result = await db.query(QUERIES.HISTORIAL, [vehiculoId]);
    return result.rows;
  }

  static async findAllMarcas() {
    const result = await db.query(QUERIES.FIND_ALL_MARCAS);
    return result.rows;
  }
}

module.exports = Vehiculo;