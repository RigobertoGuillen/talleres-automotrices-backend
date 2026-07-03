const db = require('../config/db'); // Objeto db centralizado
const bcrypt = require('bcryptjs');

class Usuario {
  static async findByUsername(nombre_usuario) {
    const result = await db.query(
      `SELECT u.*, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.nombre_usuario = $1`,
      [nombre_usuario]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const result = await db.query(
      `SELECT u.*, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.correo = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  static async findAll() {
    const result = await db.query(
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
    const result = await db.query(
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
    
    const salt = await bcrypt.genSalt(10);
    const contrasena_hash = await bcrypt.hash(contrasena, salt);

    const result = await db.query(
      `INSERT INTO usuarios
        (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id, nombre_completo, nombre_usuario, correo, activo, rol_id`,
      [nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { nombre_completo, correo, contrasena, rol_id } = data;

    let contrasena_hash = null;
    if (contrasena) {
      const salt = await bcrypt.genSalt(10);
      contrasena_hash = await bcrypt.hash(contrasena, salt);
    }

    // Si no se envía contraseña nueva, se debería mantener la existente en un entorno real.
    // Usamos COALESCE para que si contrasena_hash es null, no rompa o limpie el campo.
    const result = await db.query(
      `UPDATE usuarios
       SET nombre_completo = $1,
           correo = $2,
           contrasena_hash = COALESCE($3, contrasena_hash),
           rol_id = $4,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING
         id, nombre_completo, nombre_usuario, correo, activo, rol_id`,
      [nombre_completo, correo, contrasena_hash, rol_id, id]
    );
    return result.rows[0] || null;
  }

  static async toggleStatus(id, activo) {
    const result = await db.query(
      `UPDATE usuarios
       SET activo = $1, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, nombre_usuario, activo`,
      [activo, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Usuario;