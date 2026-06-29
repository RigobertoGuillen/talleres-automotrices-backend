const pool = require('../config/db');

class Usuario {
  static async findByUsername(nombre_usuario) {
    const result = await pool.query(
      `SELECT u.*, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.nombre_usuario = $1`,
      [nombre_usuario]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const result = await pool.query(
      `SELECT u.*, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.correo = $1`,
      [email]
    );
    return result.rows[0] || null;
  }
  static async findAll() {
    const result = await pool.query(
      `SELECT
          u.id,
          u.nombre_completo,
          u.nombre_usuario,
          u.correo,
          u.activo,
          u.rol_id,
          r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       ORDER BY u.id`
    );
    return result.rows;
  }

  // Buscar por ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT
          u.id,
          u.nombre_completo,
          u.nombre_usuario,
          u.correo,
          u.activo,
          u.rol_id,
          r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      nombre_completo,
      nombre_usuario,
      correo,
      contrasena,
      rol_id
    } = data;

    const result = await pool.query(
      `INSERT INTO usuarios
        (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id, nombre_completo, nombre_usuario, correo, activo, rol_id`,
      [nombre_completo, nombre_usuario, correo, contrasena, rol_id]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { nombre_completo, correo, contrasena, rol_id } = data;

    const result = await pool.query(
      `UPDATE usuarios
       SET nombre_completo = $1,
           correo = $2,
           contrasena_hash = $3,
           rol_id = $4,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING
         id, nombre_completo, nombre_usuario, correo, activo, rol_id`,
      [nombre_completo, correo, contrasena, rol_id, id]
    );
    return result.rows[0] || null;
  }
  static async toggleStatus(id, activo) {
    const result = await pool.query(
      `UPDATE usuarios
       SET activo = $1, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, nombre_usuario, activo`,
      [activo, id]
    );
    return result.rows[0] || null;
  }
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Usuario;