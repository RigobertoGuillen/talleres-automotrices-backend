module.exports = {
  SERVICIO_FIND_ALL: `
    SELECT id, nombre, descripcion, precio_base
    FROM servicio_catalogo
    ORDER BY nombre
  `,

  SERVICIO_FIND_BY_ID: `
    SELECT id, nombre, descripcion, precio_base
    FROM servicio_catalogo
    WHERE id = $1
  `,

  SERVICIO_FIND_BY_NOMBRE: `
    SELECT id, nombre, descripcion, precio_base
    FROM servicio_catalogo
    WHERE nombre = $1
  `,

  SERVICIO_CREATE: `
    INSERT INTO servicio_catalogo (nombre, descripcion, precio_base)
    VALUES ($1, $2, $3)
    RETURNING id, nombre, descripcion, precio_base
  `,

  SERVICIO_UPDATE: `
    UPDATE servicio_catalogo
    SET nombre = $1, descripcion = $2, precio_base = $3
    WHERE id = $4
    RETURNING id, nombre, descripcion, precio_base
  `,

  SERVICIO_DELETE: `
    DELETE FROM servicio_catalogo WHERE id = $1 RETURNING id
  `,

  SERVICIO_CHECK_EN_USO: `
    SELECT COUNT(*) FROM orden_servicio WHERE servicio_id = $1
  `
};
