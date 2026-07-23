module.exports = {
  CHECK_ORDEN: `
    SELECT numero_orden FROM ordenes_trabajo WHERE numero_orden = $1
  `,

  FIND_ALL: `
    SELECT
      d.*,
      u.nombre_completo AS mecanico
    FROM diagnosticos d
    LEFT JOIN usuarios u ON d.mecanico_id = u.id
  `,

  FIND_BY_ID: `
    SELECT
      d.*,
      u.nombre_completo AS mecanico
    FROM diagnosticos d
    LEFT JOIN usuarios u ON d.mecanico_id = u.id
    WHERE d.id = $1
  `,

  FIND_BY_ORDEN: `
    SELECT
      d.*,
      u.nombre_completo AS mecanico
    FROM diagnosticos d
    LEFT JOIN usuarios u ON d.mecanico_id = u.id
    WHERE d.orden_id = $1
    ORDER BY d.fecha_registro DESC
  `,

  // 1. Añadimos el casteo '::estado_diagnostico' al resultado del COALESCE
  CREATE: `
    INSERT INTO diagnosticos
      (orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id)
    VALUES ($1, $2, $3, $4, CAST($5 AS estado_diagnostico), $6)
    RETURNING *
  `,

  UPDATE: `
    UPDATE diagnosticos
    SET descripcion_falla = $1,
        recomendaciones = $2,
        observaciones = $3,
        fecha_actualizacion = now()
    WHERE id = $4
    RETURNING *
  `,

  UPDATE_OBSERVACIONES: `
    UPDATE diagnosticos
    SET observaciones = $1, fecha_actualizacion = now()
    WHERE id = $2
    RETURNING *
  `,

  // 2. Añadimos el casteo '::estado_diagnostico' al parámetro del nuevo estado ($1)
  UPDATE_ESTADO: `
    UPDATE diagnosticos
    SET estado = CAST($1 AS estado_diagnostico), fecha_actualizacion = now()
    WHERE id = $2
    RETURNING *
  `
};