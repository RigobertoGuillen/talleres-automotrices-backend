module.exports = {
  CATEGORIA_FIND_ALL: `
    SELECT id, nombre
    FROM categorias_repuestos
    ORDER BY nombre
  `,

  CATEGORIA_FIND_BY_ID: `
    SELECT id, nombre
    FROM categorias_repuestos
    WHERE id = $1
  `,

  CATEGORIA_CREATE: `
    INSERT INTO categorias_repuestos (nombre)
    VALUES ($1)
    RETURNING id, nombre
  `,

  CATEGORIA_UPDATE: `
    UPDATE categorias_repuestos
    SET nombre = $1
    WHERE id = $2
    RETURNING id, nombre
  `,

  CATEGORIA_DELETE: `
    DELETE FROM categorias_repuestos
    WHERE id = $1
    RETURNING id
  `,

  CATEGORIA_CHECK_REPUESTOS: `
    SELECT COUNT(*) FROM repuestos
    WHERE categoria_id = $1
  `,

  REPUESTO_FIND_ALL: `
    SELECT 
      r.id, r.codigo, r.nombre, r.categoria_id,
      c.nombre AS categoria_nombre,
      r.costo_unitario, r.precio_unitario,
      COALESCE(s.cantidad_disponible, 0) AS cantidad_disponible,
      COALESCE(s.cantidad_minima, 0) AS cantidad_minima,
      r.fecha_creacion
    FROM repuestos r
    JOIN categorias_repuestos c ON r.categoria_id = c.id
    LEFT JOIN stock_repuestos s ON r.id = s.repuesto_id
    ORDER BY r.nombre
  `,

  REPUESTO_FIND_BY_ID: `
    SELECT 
      r.id, r.codigo, r.nombre, r.categoria_id,
      c.nombre AS categoria_nombre,
      r.costo_unitario, r.precio_unitario,
      COALESCE(s.cantidad_disponible, 0) AS cantidad_disponible,
      COALESCE(s.cantidad_minima, 0) AS cantidad_minima,
      r.fecha_creacion
    FROM repuestos r
    JOIN categorias_repuestos c ON r.categoria_id = c.id
    LEFT JOIN stock_repuestos s ON r.id = s.repuesto_id
    WHERE r.id = $1
  `,

  REPUESTO_FIND_BY_CODIGO: `
    SELECT id, codigo, nombre, categoria_id
    FROM repuestos
    WHERE codigo = $1
  `,

  REPUESTO_BUSCAR: `
    SELECT 
      r.id, r.codigo, r.nombre, r.categoria_id,
      c.nombre AS categoria_nombre,
      r.costo_unitario, r.precio_unitario,
      COALESCE(s.cantidad_disponible, 0) AS cantidad_disponible,
      COALESCE(s.cantidad_minima, 0) AS cantidad_minima,
      r.fecha_creacion
    FROM repuestos r
    JOIN categorias_repuestos c ON r.categoria_id = c.id
    LEFT JOIN stock_repuestos s ON r.id = s.repuesto_id
    WHERE r.nombre ILIKE $1 OR r.codigo ILIKE $1
    ORDER BY r.nombre
  `,

  REPUESTO_CREATE: `
    INSERT INTO repuestos (codigo, nombre, categoria_id, costo_unitario, precio_unitario)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, codigo, nombre, categoria_id, costo_unitario, precio_unitario, fecha_creacion
  `,

  REPUESTO_UPDATE: `
    UPDATE repuestos
    SET codigo = $1, nombre = $2, categoria_id = $3, 
        costo_unitario = $4, precio_unitario = $5
    WHERE id = $6
    RETURNING id, codigo, nombre, categoria_id, costo_unitario, precio_unitario, fecha_creacion
  `,

  REPUESTO_DELETE: `
    DELETE FROM repuestos WHERE id = $1 RETURNING id
  `,

  REPUESTO_CHECK_STOCK: `
    SELECT COUNT(*) FROM stock_repuestos WHERE repuesto_id = $1
  `,

  REPUESTO_CHECK_MOVIMIENTOS: `
    SELECT COUNT(*) FROM movimientos_inventario WHERE repuesto_id = $1
  `,

  STOCK_FIND_BY_REPUESTO: `
    SELECT repuesto_id, cantidad_disponible, cantidad_minima, fecha_actualizacion
    FROM stock_repuestos
    WHERE repuesto_id = $1
  `,

  STOCK_CREATE: `
    INSERT INTO stock_repuestos (repuesto_id, cantidad_disponible, cantidad_minima)
    VALUES ($1, $2, $3)
    RETURNING repuesto_id, cantidad_disponible, cantidad_minima, fecha_actualizacion
  `,

  STOCK_UPDATE: `
    UPDATE stock_repuestos
    SET cantidad_disponible = $1, cantidad_minima = $2, fecha_actualizacion = NOW()
    WHERE repuesto_id = $3
    RETURNING repuesto_id, cantidad_disponible, cantidad_minima, fecha_actualizacion
  `,

  STOCK_ACTUALIZAR_CANTIDAD: `
    UPDATE stock_repuestos
    SET cantidad_disponible = cantidad_disponible + $1, fecha_actualizacion = NOW()
    WHERE repuesto_id = $2
    RETURNING repuesto_id, cantidad_disponible, cantidad_minima, fecha_actualizacion
  `,

  STOCK_BAJO: `
    SELECT 
      r.id, r.codigo, r.nombre,
      s.cantidad_disponible, s.cantidad_minima
    FROM repuestos r
    JOIN stock_repuestos s ON r.id = s.repuesto_id
    WHERE s.cantidad_disponible <= s.cantidad_minima
    ORDER BY s.cantidad_disponible ASC
  `,

  MOVIMIENTO_FIND_ALL: `
    SELECT 
      m.id, m.repuesto_id, m.tipo_movimiento, m.cantidad,
      m.motivo, m.orden_id, m.usuario_id, m.fecha_hora,
      r.nombre AS repuesto_nombre,
      u.nombre_completo AS usuario_nombre
    FROM movimientos_inventario m
    JOIN repuestos r ON m.repuesto_id = r.id
    LEFT JOIN usuarios u ON m.usuario_id = u.id
    ORDER BY m.fecha_hora DESC
    LIMIT $1 OFFSET $2
  `,

  MOVIMIENTO_FIND_BY_REPUESTO: `
    SELECT 
      id, repuesto_id, tipo_movimiento, cantidad,
      motivo, orden_id, usuario_id, fecha_hora
    FROM movimientos_inventario
    WHERE repuesto_id = $1
    ORDER BY fecha_hora DESC
  `,

  MOVIMIENTO_CREATE: `
    INSERT INTO movimientos_inventario (
      repuesto_id, tipo_movimiento, cantidad, motivo, 
      orden_id, usuario_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, repuesto_id, tipo_movimiento, cantidad, 
              motivo, orden_id, usuario_id, fecha_hora
  `,

  MOVIMIENTO_REPORTE: `
    SELECT 
      DATE(fecha_hora) as fecha,
      SUM(CASE WHEN tipo_movimiento = 'entrada' THEN cantidad ELSE 0 END) as entradas,
      SUM(CASE WHEN tipo_movimiento = 'salida' THEN cantidad ELSE 0 END) as salidas,
      COUNT(*) as total_movimientos
    FROM movimientos_inventario
    WHERE fecha_hora >= $1 AND fecha_hora <= $2
    GROUP BY DATE(fecha_hora)
    ORDER BY fecha DESC
  `,

  SOLICITUD_FIND_ALL: `
    SELECT 
      s.id, s.orden_id, s.repuesto_id, s.cantidad_solicitada,
      s.costo_historico, s.precio_historico, s.mecanico_id,
      s.fecha_solicitud, s.estado, s.aprobado_por, s.fecha_aprobacion,
      r.nombre AS repuesto_nombre,
      r.codigo AS repuesto_codigo,
      o.descripcion_problema AS orden_descripcion,
      u.nombre_completo AS mecanico_nombre,
      a.nombre_completo AS aprobado_por_nombre
    FROM solicitudes_repuestos s
    JOIN repuestos r ON s.repuesto_id = r.id
    JOIN ordenes_trabajo o ON s.orden_id = o.numero_orden
    LEFT JOIN usuarios u ON s.mecanico_id = u.id
    LEFT JOIN usuarios a ON s.aprobado_por = a.id
    ORDER BY s.fecha_solicitud DESC
  `,

  SOLICITUD_FIND_PENDIENTES: `
    SELECT 
      s.id, s.orden_id, s.repuesto_id, s.cantidad_solicitada,
      s.costo_historico, s.precio_historico, s.mecanico_id,
      s.fecha_solicitud, s.estado,
      r.nombre AS repuesto_nombre,
      r.codigo AS repuesto_codigo,
      o.descripcion_problema AS orden_descripcion,
      u.nombre_completo AS mecanico_nombre
    FROM solicitudes_repuestos s
    JOIN repuestos r ON s.repuesto_id = r.id
    JOIN ordenes_trabajo o ON s.orden_id = o.numero_orden
    LEFT JOIN usuarios u ON s.mecanico_id = u.id
    WHERE s.estado = 'pendiente' OR s.estado IS NULL
    ORDER BY s.fecha_solicitud ASC
  `,

  SOLICITUD_CREATE: `
    INSERT INTO solicitudes_repuestos (
      orden_id, repuesto_id, cantidad_solicitada,
      costo_historico, precio_historico, mecanico_id, estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
    RETURNING *
  `,

  SOLICITUD_APROBAR: `
    UPDATE solicitudes_repuestos
    SET estado = $1, aprobado_por = $2, fecha_aprobacion = NOW()
    WHERE id = $3
    RETURNING *
  `,

  SOLICITUD_FIND_BY_ORDEN: `
    SELECT 
      s.id, s.repuesto_id, s.cantidad_solicitada,
      s.costo_historico, s.precio_historico,
      s.fecha_solicitud, s.estado,
      r.nombre AS repuesto_nombre,
      r.codigo AS repuesto_codigo
    FROM solicitudes_repuestos s
    JOIN repuestos r ON s.repuesto_id = r.id
    WHERE s.orden_id = $1
    ORDER BY s.fecha_solicitud DESC
  `
};