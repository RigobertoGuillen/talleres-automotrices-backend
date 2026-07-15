module.exports = {
  FIND_ALL_BASE: `
    SELECT o.*, 
           v.placa, v.modelo,
           CONCAT(c.primer_nombre, ' ', c.primer_apellido) as cliente_nombre,
           u.nombre_completo as mecanico_nombre
    FROM ordenes_trabajo o
    JOIN vehiculos v ON o.vehiculo_id = v.id
    JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN usuarios u ON o.mecanico_id = u.id
    WHERE 1=1
  `,

  FIND_BY_ID: `
    SELECT o.*, 
            v.placa, v.modelo, m.nombre AS marca, v.anio,
            c.id as cliente_id, 
            CONCAT(c.primer_nombre, ' ', c.primer_apellido) as cliente_nombre, 
            c.telefono,
            u.id as mecanico_id, u.nombre_completo as mecanico_nombre,
            COALESCE(
              (SELECT json_agg(json_build_object(
                'id', d.id,
                'descripcion_falla', d.descripcion_falla,
                'observaciones', d.observaciones,
                'estado', d.estado
              )) FROM diagnosticos d WHERE d.orden_id = o.id),
              '[]'::json
            ) as diagnosticos,
            COALESCE(
              (SELECT json_agg(json_build_object(
                'id', h.id,
                'estado', h.estado,
                'notas', h.notas,
                'fecha_hora', h.fecha_hora
              ) ORDER BY h.fecha_hora DESC) 
              FROM historial_estados_orden h WHERE h.orden_id = o.id),
              '[]'::json
            ) as historial_estados
    FROM ordenes_trabajo o
    JOIN vehiculos v ON o.vehiculo_id = v.id
    JOIN marcas_vehiculo m ON v.marca_id = m.id
    JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN usuarios u ON o.mecanico_id = u.id
    WHERE o.id = $1
    GROUP BY o.id, v.id, m.id, c.id, u.id
  `,

  CREATE: `
    INSERT INTO ordenes_trabajo 
      (vehiculo_id, descripcion_problema, prioridad) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `,

  ASIGNAR_MECANICO: `
    UPDATE ordenes_trabajo 
    SET mecanico_id = $1, fecha_actualizacion = NOW() 
    WHERE id = $2 
    RETURNING *
  `,

  ACTUALIZAR_ESTADO: `
    UPDATE ordenes_trabajo 
    SET estado = $1, fecha_actualizacion = NOW() 
    WHERE id = $2 
    RETURNING *
  `,

  INSERT_HISTORIAL: `
    INSERT INTO historial_estados_orden (orden_id, estado, notas, usuario_id) 
    VALUES ($1, $2, $3, $4)
  `,

  CERRAR: `
    UPDATE ordenes_trabajo 
    SET estado = 'entregado', fecha_actualizacion = NOW() 
    WHERE id = $1 AND estado != 'entregado'
    RETURNING *
  `,

  REASIGNAR: `
    UPDATE ordenes_trabajo 
    SET mecanico_id = $1, fecha_actualizacion = NOW() 
    WHERE id = $2 
    RETURNING *
  `,

  FIND_BY_MECANICO: `
    SELECT o.*, 
            v.placa, v.modelo,
            CONCAT(c.primer_nombre, ' ', c.primer_apellido) as cliente_nombre
    FROM ordenes_trabajo o
    JOIN vehiculos v ON o.vehiculo_id = v.id
    JOIN clientes c ON v.cliente_id = c.id
    WHERE o.mecanico_id = $1
    ORDER BY o.fecha_ingreso DESC
  `,

  CHECK_VEHICULO: `
    SELECT cliente_id FROM vehiculos WHERE id = $1
  `,
};