const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/usuarioQueries');

class UsuarioRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  async findByUsername(username) {
    const result = await this.query(this.queries.FIND_BY_USERNAME, [username]);
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await this.query(this.queries.FIND_BY_EMAIL, [email]);
    return result.rows[0] || null;
  }

  async findById(id) {
    const result = await this.query(this.queries.FIND_BY_ID, [id]);
    return result.rows[0] || null;
  }

  async findAll() {
    const result = await this.query(this.queries.FIND_ALL);
    return result.rows;
  }

  async create(usuarioData) {
    const { nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id } = usuarioData;
    const result = await this.query(this.queries.CREATE, [
      nombre_completo,
      nombre_usuario,
      correo,
      contrasena_hash,
      rol_id
    ]);
    return result.rows[0] || null;
  }

  async update(id, data) {
    const { nombre_completo, correo, contrasena_hash, rol_id } = data;
    const result = await this.query(this.queries.UPDATE, [
      nombre_completo,
      correo,
      contrasena_hash,
      rol_id,
      id
    ]);
    return result.rows[0] || null;
  }

  async updatePassword(id, newHash) {
    const sql = `
      UPDATE usuarios 
      SET contrasena_hash = $1, fecha_actualizacion = NOW() 
      WHERE id = $2 
      RETURNING id, nombre_usuario, correo
    `;
    const result = await this.query(sql, [newHash, id]);
    return result.rows[0] || null;
  }

  async toggleStatus(id, activo) {
    const result = await this.query(this.queries.TOGGLE_STATUS, [activo, id]);
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await this.query(this.queries.DELETE, [id]);
    return result.rows[0] || null;
  }
}

module.exports = new UsuarioRepository();