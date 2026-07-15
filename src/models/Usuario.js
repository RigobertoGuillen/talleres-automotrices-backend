const db = require('../config/db');
const bcrypt = require('bcryptjs');
const QUERIES = require('../constants/queries/usuarioQueries');

class Usuario {
  static async findByUsername(nombre_usuario) {
    const result = await db.query(QUERIES.FIND_BY_USERNAME, [nombre_usuario]);
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const result = await db.query(QUERIES.FIND_BY_EMAIL, [email]);
    return result.rows[0] || null;
  }

  static async findAll() {
    const result = await db.query(QUERIES.FIND_ALL);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(QUERIES.FIND_BY_ID, [id]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { nombre_completo, nombre_usuario, correo, contrasena, rol_id } = data;
    const salt = await bcrypt.genSalt(10);
    const contrasena_hash = await bcrypt.hash(contrasena, salt);

    const result = await db.query(QUERIES.CREATE, [
      nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id
    ]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { nombre_completo, correo, contrasena, rol_id } = data;

    let contrasena_hash = null;
    if (contrasena) {
      const salt = await bcrypt.genSalt(10);
      contrasena_hash = await bcrypt.hash(contrasena, salt);
    }

    const result = await db.query(QUERIES.UPDATE, [
      nombre_completo, correo, contrasena_hash, rol_id, id
    ]);
    return result.rows[0] || null;
  }

  static async toggleStatus(id, activo) {
    const result = await db.query(QUERIES.TOGGLE_STATUS, [activo, id]);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(QUERIES.DELETE, [id]);
    return result.rows[0] || null;
  }
}

module.exports = Usuario;