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
  `,

  ORDEN_SERVICIO_FIND_BY_ORDEN: `
    SELECT
      os.id, os.orden_id, os.servicio_id,
      sc.nombre AS servicio_nombre,
      os.tiempo_empleado_minutos, os.observaciones,
      os.precio_aplicado, os.fecha_registro
    FROM orden_servicio os
    JOIN servicio_catalogo sc ON sc.id = os.servicio_id
    WHERE os.orden_id = $1
    ORDER BY os.fecha_registro DESC
  `,

  ORDEN_SERVICIO_FIND_BY_ID: `
    SELECT
      os.id, os.orden_id, os.servicio_id,
      sc.nombre AS servicio_nombre,
      os.tiempo_empleado_minutos, os.observaciones,
      os.precio_aplicado, os.fecha_registro
    FROM orden_servicio os
    JOIN servicio_catalogo sc ON sc.id = os.servicio_id
    WHERE os.id = $1
  `,

  ORDEN_SERVICIO_CHECK_ORDEN_EXISTE: `
    SELECT numero_orden FROM ordenes_trabajo WHERE numero_orden = $1
  `,

  ORDEN_SERVICIO_CREATE: `
    INSERT INTO orden_servicio (
      orden_id, servicio_id, tiempo_empleado_minutos,
      observaciones, precio_aplicado
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, orden_id, servicio_id, tiempo_empleado_minutos,
              observaciones, precio_aplicado, fecha_registro
  `,

  ORDEN_SERVICIO_DELETE: `
    DELETE FROM orden_servicio WHERE id = $1 RETURNING id
  `
};
