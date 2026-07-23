module.exports = {
  REPORTE_SERVICIOS: `
    SELECT 
      sc.nombre AS servicio,
      COUNT(os.id) AS cantidad,
      SUM(os.precio_aplicado) AS total_ingresos,
      AVG(os.precio_aplicado) AS promedio,
      DATE_TRUNC('month', os.fecha_registro) AS mes
    FROM orden_servicio os
    JOIN servicio_catalogo sc ON os.servicio_id = sc.id
    WHERE os.fecha_registro >= $1 AND os.fecha_registro <= $2
    GROUP BY sc.nombre, DATE_TRUNC('month', os.fecha_registro)
    ORDER BY cantidad DESC
  `,

  REPORTE_VEHICULOS_ATENDIDOS: `
    SELECT 
      v.placa,
      v.modelo,
      v.anio,
      v.tipo,
      COUNT(o.numero_orden) AS total_ordenes,
      SUM(f.total) AS total_facturado,
      MAX(o.fecha_ingreso) AS ultima_atencion
    FROM vehiculos v
    JOIN ordenes_trabajo o ON o.vehiculo_id = v.id
    LEFT JOIN facturas f ON f.orden_id = o.numero_orden
    WHERE o.fecha_ingreso >= $1 AND o.fecha_ingreso <= $2
    GROUP BY v.id, v.placa, v.modelo, v.anio, v.tipo
    ORDER BY total_ordenes DESC
  `,

  REPORTE_REPUESTOS_UTILIZADOS: `
    SELECT 
      r.nombre AS repuesto,
      r.codigo,
      SUM(m.cantidad) AS total_utilizado,
      SUM(m.cantidad * r.precio_unitario) AS valor_total,
      COUNT(DISTINCT m.orden_id) AS ordenes_asociadas
    FROM movimientos_inventario m
    JOIN repuestos r ON m.repuesto_id = r.id
    WHERE m.tipo_movimiento = 'salida'
      AND m.fecha_hora >= $1 AND m.fecha_hora <= $2
    GROUP BY r.id, r.nombre, r.codigo
    ORDER BY total_utilizado DESC
  `,

  REPORTE_INGRESOS: `
    SELECT 
      DATE_TRUNC('day', f.fecha_emision) AS fecha,
      COUNT(f.id) AS total_facturas,
      SUM(f.subtotal_exento) AS subtotal_exento,
      SUM(f.subtotal_gravado_15) AS subtotal_gravado,
      SUM(f.isv_15) AS isv_total,
      SUM(f.total) AS total_ingresos
    FROM facturas f
    WHERE f.fecha_emision >= $1 AND f.fecha_emision <= $2
    GROUP BY DATE_TRUNC('day', f.fecha_emision)
    ORDER BY fecha DESC
  `,

  REPORTE_POR_MECANICO: `
    SELECT 
      u.nombre_completo AS mecanico,
      COUNT(o.numero_orden) AS total_ordenes,
      COUNT(CASE WHEN o.estado = 'entregado' THEN 1 END) AS completadas,
      COUNT(CASE WHEN o.estado != 'entregado' THEN 1 END) AS pendientes,
      COUNT(os.id) AS servicios_realizados,
      COALESCE(SUM(f.total), 0) AS ingresos_generados
    FROM usuarios u
    LEFT JOIN ordenes_trabajo o ON o.mecanico_id = u.id
    LEFT JOIN facturas f ON f.orden_id = o.numero_orden
    LEFT JOIN orden_servicio os ON os.orden_id = o.numero_orden
    WHERE u.rol_id = (SELECT id FROM roles WHERE nombre = 'mecanico')
      AND (o.fecha_ingreso >= $1 OR o.fecha_ingreso IS NULL)
      AND (o.fecha_ingreso <= $2 OR o.fecha_ingreso IS NULL)
    GROUP BY u.id, u.nombre_completo
    ORDER BY completadas DESC
  `,

  REPORTE_ORDENES_PENDIENTES: `
    SELECT 
      o.numero_orden,
      v.placa,
      v.modelo,
      CONCAT(c.primer_nombre, ' ', c.primer_apellido) AS cliente,
      o.descripcion_problema,
      o.estado::text AS estado,
      o.fecha_ingreso,
      EXTRACT(DAY FROM (NOW() - o.fecha_ingreso)) AS dias_antiguedad,
      u.nombre_completo AS mecanico_asignado,
      COALESCE(COUNT(d.id), 0) AS diagnosticos_realizados
    FROM ordenes_trabajo o
    JOIN vehiculos v ON o.vehiculo_id = v.id
    JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN usuarios u ON o.mecanico_id = u.id
    LEFT JOIN diagnosticos d ON d.orden_id = o.numero_orden
    WHERE o.estado != 'entregado'
    GROUP BY o.numero_orden, v.placa, v.modelo, c.primer_nombre, c.primer_apellido,
             o.descripcion_problema, o.estado, o.fecha_ingreso, u.nombre_completo
    ORDER BY o.fecha_ingreso ASC
  `,

  ORDENES_PENDIENTES_FILTRADAS: `
    SELECT 
      o.numero_orden,
      v.placa,
      v.modelo,
      CONCAT(c.primer_nombre, ' ', c.primer_apellido) AS cliente,
      o.descripcion_problema,
      o.estado::text AS estado,
      o.fecha_ingreso,
      EXTRACT(DAY FROM (NOW() - o.fecha_ingreso)) AS dias_antiguedad,
      u.nombre_completo AS mecanico_asignado,
      COALESCE(COUNT(d.id), 0) AS diagnosticos_realizados
    FROM ordenes_trabajo o
    JOIN vehiculos v ON o.vehiculo_id = v.id
    JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN usuarios u ON o.mecanico_id = u.id
    LEFT JOIN diagnosticos d ON d.orden_id = o.numero_orden
    WHERE o.estado != 'entregado'
    GROUP BY o.numero_orden, v.placa, v.modelo, c.primer_nombre, c.primer_apellido,
             o.descripcion_problema, o.estado, o.fecha_ingreso, u.nombre_completo
    HAVING $1 = '' OR o.estado::text = $1
    ORDER BY o.fecha_ingreso ASC
  `,

  DASHBOARD_GENERAL: `
    SELECT 
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado != 'entregado') AS ordenes_activas,
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado = 'recibido') AS ordenes_nuevas,
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado = 'en reparacion') AS ordenes_en_reparacion,
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado = 'listo') AS ordenes_listas,
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE fecha_ingreso >= CURRENT_DATE) AS ordenes_hoy,
      (SELECT COALESCE(SUM(total), 0) FROM facturas WHERE fecha_emision >= CURRENT_DATE) AS ingresos_hoy,
      (SELECT COALESCE(SUM(total), 0) FROM facturas WHERE fecha_emision >= CURRENT_DATE - INTERVAL '7 days') AS ingresos_semana,
      (SELECT COALESCE(SUM(total), 0) FROM facturas WHERE fecha_emision >= CURRENT_DATE - INTERVAL '30 days') AS ingresos_mes,
      (SELECT COUNT(*) FROM repuestos r JOIN stock_repuestos s ON r.id = s.repuesto_id WHERE s.cantidad_disponible <= s.cantidad_minima) AS stock_critico,
      (SELECT COUNT(*) FROM diagnosticos WHERE estado = 'pendiente') AS diagnosticos_pendientes
  `
};