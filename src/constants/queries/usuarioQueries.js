module.exports = {
  FIND_BY_USERNAME: `
    SELECT u.*, r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.nombre_usuario = $1
  `,

  FIND_BY_EMAIL: `
    SELECT u.*, r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.correo = $1
  `,

  FIND_ALL: `
    SELECT
      u.id, u.nombre_completo, u.nombre_usuario, u.correo,
      u.activo, u.rol_id, r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    ORDER BY u.id
  `,

  FIND_BY_ID: `
    SELECT
      u.id, u.nombre_completo, u.nombre_usuario, u.correo,
      u.activo, u.rol_id, r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.id = $1
  `,

  CREATE: `
    INSERT INTO usuarios
      (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, nombre_completo, nombre_usuario, correo, activo, rol_id
  `,

  UPDATE: `
    UPDATE usuarios
    SET nombre_completo = $1,
        correo = $2,
        contrasena_hash = COALESCE($3, contrasena_hash),
        rol_id = $4,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING id, nombre_completo, nombre_usuario, correo, activo, rol_id
  `,

  TOGGLE_STATUS: `
    UPDATE usuarios
    SET activo = $1, fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, nombre_usuario, activo
  `,

  DELETE: `
    DELETE FROM usuarios WHERE id = $1 RETURNING id
  `,
};