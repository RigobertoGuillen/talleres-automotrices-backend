module.exports = {
  FIND_ALL: `
    SELECT c.*, 
      d.calle, d.colonia, d.ciudad, d.departamento, d.referencia,
      (SELECT COUNT(*) FROM vehiculos v WHERE v.cliente_id = c.id) as total_vehiculos
    FROM clientes c
    LEFT JOIN direcciones d ON c.direccion_id = d.id
    ORDER BY c.id
  `,

  FIND_BY_ID: `
    SELECT c.*, 
      d.calle, d.colonia, d.ciudad, d.departamento, d.referencia,
      (SELECT json_agg(v.*) FROM vehiculos v WHERE v.cliente_id = c.id) as vehiculos
    FROM clientes c
    LEFT JOIN direcciones d ON c.direccion_id = d.id
    WHERE c.id = $1
  `,

  FIND_BY_DNI: `
    SELECT c.*, 
      d.calle, d.colonia, d.ciudad, d.departamento, d.referencia
    FROM clientes c
    LEFT JOIN direcciones d ON c.direccion_id = d.id
    WHERE c.dni = $1
  `,

  FIND_BY_NOMBRE: `
    SELECT c.*, 
      d.calle, d.colonia, d.ciudad, d.departamento, d.referencia
    FROM clientes c
    LEFT JOIN direcciones d ON c.direccion_id = d.id
    WHERE c.primer_nombre ILIKE $1 
      OR c.primer_apellido ILIKE $1
      OR CONCAT(c.primer_nombre, ' ', c.primer_apellido) ILIKE $1
    ORDER BY c.id
  `,

  CREATE_DIRECCION: `
    INSERT INTO direcciones (calle, colonia, ciudad, departamento, referencia) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id
  `,

  CREATE: `
    INSERT INTO clientes 
      (dni, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo, direccion_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING *
  `,

  UPDATE_DIRECCION: `
    UPDATE direcciones 
    SET calle = $1, colonia = $2, ciudad = $3, departamento = $4, referencia = $5
    WHERE id = $6
  `,

  UPDATE: `
    UPDATE clientes SET 
      dni = COALESCE($1, dni),
      primer_nombre = COALESCE($2, primer_nombre),
      segundo_nombre = COALESCE($3, segundo_nombre),
      primer_apellido = COALESCE($4, primer_apellido),
      segundo_apellido = COALESCE($5, segundo_apellido),
      telefono = COALESCE($6, telefono),
      correo = COALESCE($7, correo),
      direccion_id = COALESCE($8, direccion_id)
    WHERE id = $9
    RETURNING *
  `,

  REGISTRAR_AUDITORIA: `
    INSERT INTO auditoria_clientes (cliente_id, campo_modificado, valor_anterior, valor_nuevo) 
    VALUES ($1, $2, $3, $4) 
    RETURNING *
  `,

  CHECK_ORDENES: `
    SELECT COUNT(*) FROM vehiculos v 
    WHERE v.cliente_id = $1 AND EXISTS (
      SELECT 1 FROM ordenes_trabajo o WHERE o.vehiculo_id = v.id
    )
  `,

  DELETE: `
    DELETE FROM clientes WHERE id = $1 RETURNING id
  `,

  GET_HISTORIAL: `
    SELECT
      o.numero_orden,
      o.vehiculo_id,
      o.mecanico_id,
      o.fecha_ingreso,
      o.descripcion_problema,
      o.estado,
      o.prioridad,
      o.fecha_creacion,
      o.fecha_actualizacion,
      v.placa,
      v.modelo,
      u.nombre_completo AS mecanico_nombre,
      d.descripcion_falla,
      d.observaciones AS diagnostico_observaciones
    FROM ordenes_trabajo o
    LEFT JOIN vehiculos v ON o.vehiculo_id = v.id
    LEFT JOIN usuarios u ON o.mecanico_id = u.id
    LEFT JOIN diagnosticos d ON o.numero_orden = d.orden_id
    WHERE v.cliente_id = $1
    ORDER BY o.fecha_ingreso DESC
  `
};