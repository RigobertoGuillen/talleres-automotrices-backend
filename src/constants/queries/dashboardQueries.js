module.exports = {
  GET_STATS: `
    SELECT 
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado IN ('recibido', 'en reparacion')) AS ordenes_progreso,
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado = 'listo') AS vehiculos_listos,
      (SELECT COUNT(*) FROM diagnosticos WHERE estado = 'pendiente') AS diagnosticos_pendientes,
      (SELECT COUNT(*) FROM stock_repuestos WHERE cantidad_disponible <= cantidad_minima) AS alertas_inventario
  `,

  ORDENES_RECIENTES: `
    SELECT 
      o.numero_orden,
      v.placa,
      mv.nombre AS marca,
      v.modelo,
      CONCAT(c.primer_nombre, ' ', c.primer_apellido) AS cliente,
      o.estado,
      o.fecha_ingreso
    FROM ordenes_trabajo o
    JOIN vehiculos v ON o.vehiculo_id = v.id
    JOIN marcas_vehiculo mv ON v.marca_id = mv.id
    JOIN clientes c ON v.cliente_id = c.id
    WHERE o.estado != 'entregado'
    ORDER BY o.prioridad DESC, o.fecha_ingreso ASC
    LIMIT 5
  `,

  CARGA_MECANICOS: `
    SELECT 
      u.id,
      u.nombre_completo,
      COUNT(o.numero_orden) AS ordenes_asignadas
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    LEFT JOIN ordenes_trabajo o 
      ON o.mecanico_id = u.id AND o.estado != 'entregado'
    WHERE r.nombre = 'mecanico' AND u.activo = true
    GROUP BY u.id, u.nombre_completo
    ORDER BY ordenes_asignadas DESC
  `,

  ALERTAS_STOCK: `
    SELECT r.nombre, s.cantidad_disponible, s.cantidad_minima
    FROM repuestos r
    JOIN stock_repuestos s ON r.id = s.repuesto_id
    WHERE s.cantidad_disponible <= s.cantidad_minima
    ORDER BY s.cantidad_disponible ASC
    LIMIT 5
  `,

  ORDENES_RETRASADAS: `
    SELECT numero_orden, fecha_ingreso, estado
    FROM ordenes_trabajo
    WHERE estado != 'entregado'
      AND fecha_ingreso <= (CURRENT_DATE - INTERVAL '2 days')
    ORDER BY fecha_ingreso ASC
    LIMIT 5
  `
};