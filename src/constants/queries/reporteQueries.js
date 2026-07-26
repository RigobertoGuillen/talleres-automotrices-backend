module.exports = {
  // ── HU-39: Reporte de servicios realizados ──────────────────────────────
  SERVICIOS_DETALLE: `
    SELECT
      os.id, os.orden_id, os.tiempo_empleado_minutos, os.observaciones,
      os.precio_aplicado, os.fecha_registro,
      sc.nombre AS servicio_nombre,
      o.fecha_ingreso, o.estado AS orden_estado,
      u.nombre_completo AS mecanico_nombre
    FROM orden_servicio os
    JOIN servicio_catalogo sc ON sc.id = os.servicio_id
    JOIN ordenes_trabajo o ON o.numero_orden = os.orden_id
    LEFT JOIN usuarios u ON u.id = o.mecanico_id
    WHERE os.fecha_registro::date BETWEEN $1 AND $2
    ORDER BY os.fecha_registro DESC
  `,

  SERVICIOS_RESUMEN: `
    SELECT
      sc.id AS servicio_id, sc.nombre AS servicio_nombre,
      COUNT(os.id) AS cantidad_realizada,
      SUM(os.precio_aplicado) AS total_generado
    FROM orden_servicio os
    JOIN servicio_catalogo sc ON sc.id = os.servicio_id
    WHERE os.fecha_registro::date BETWEEN $1 AND $2
    GROUP BY sc.id, sc.nombre
    ORDER BY cantidad_realizada DESC
  `,

  // ── HU-40: Reporte de vehículos atendidos ───────────────────────────────
  VEHICULOS_ATENDIDOS_DETALLE: `
    SELECT
      v.id AS vehiculo_id, v.placa, v.modelo, v.anio, v.tipo,
      mv.nombre AS marca,
      c.primer_nombre, c.primer_apellido,
      COUNT(o.numero_orden) AS total_ordenes,
      MAX(o.fecha_ingreso) AS ultima_visita
    FROM ordenes_trabajo o
    JOIN vehiculos v ON v.id = o.vehiculo_id
    JOIN marcas_vehiculo mv ON mv.id = v.marca_id
    JOIN clientes c ON c.id = v.cliente_id
    WHERE o.fecha_ingreso BETWEEN $1 AND $2
    GROUP BY v.id, v.placa, v.modelo, v.anio, v.tipo, mv.nombre, c.primer_nombre, c.primer_apellido
    ORDER BY total_ordenes DESC
  `,

  VEHICULOS_ATENDIDOS_POR_TIPO: `
    SELECT
      v.tipo,
      COUNT(DISTINCT v.id) AS vehiculos_distintos,
      COUNT(o.numero_orden) AS total_ordenes
    FROM ordenes_trabajo o
    JOIN vehiculos v ON v.id = o.vehiculo_id
    WHERE o.fecha_ingreso BETWEEN $1 AND $2
    GROUP BY v.tipo
    ORDER BY total_ordenes DESC
  `,

  // ── HU-41: Reporte de inventario utilizado ──────────────────────────────
  INVENTARIO_UTILIZADO_DETALLE: `
    SELECT
      m.id, m.fecha_hora, m.cantidad, m.motivo, m.orden_id,
      r.codigo, r.nombre AS repuesto_nombre,
      c.nombre AS categoria_nombre,
      u.nombre_completo AS usuario_nombre
    FROM movimientos_inventario m
    JOIN repuestos r ON r.id = m.repuesto_id
    LEFT JOIN categorias_repuestos c ON c.id = r.categoria_id
    LEFT JOIN usuarios u ON u.id = m.usuario_id
    WHERE m.tipo_movimiento = 'salida'
      AND m.fecha_hora::date BETWEEN $1 AND $2
    ORDER BY m.fecha_hora DESC
  `,

  INVENTARIO_UTILIZADO_RESUMEN: `
    SELECT
      r.id AS repuesto_id, r.codigo, r.nombre AS repuesto_nombre,
      SUM(m.cantidad) AS cantidad_consumida,
      COUNT(m.id) AS movimientos
    FROM movimientos_inventario m
    JOIN repuestos r ON r.id = m.repuesto_id
    WHERE m.tipo_movimiento = 'salida'
      AND m.fecha_hora::date BETWEEN $1 AND $2
    GROUP BY r.id, r.codigo, r.nombre
    ORDER BY cantidad_consumida DESC
  `,

  // ── HU-42: Reporte de ingresos ───────────────────────────────────────────
  INGRESOS_POR_DIA: `
    SELECT
      f.fecha_emision::date AS periodo,
      COUNT(f.id) AS facturas,
      SUM(f.subtotal_exento + f.subtotal_gravado_15) AS subtotal,
      SUM(f.isv_15) AS impuesto,
      SUM(f.total) AS total
    FROM facturas f
    WHERE f.fecha_emision::date BETWEEN $1 AND $2
    GROUP BY f.fecha_emision::date
    ORDER BY periodo ASC
  `,

  INGRESOS_TOTALES: `
    SELECT
      COUNT(f.id) AS facturas,
      COALESCE(SUM(f.subtotal_exento + f.subtotal_gravado_15), 0) AS subtotal,
      COALESCE(SUM(f.isv_15), 0) AS impuesto,
      COALESCE(SUM(f.total), 0) AS total
    FROM facturas f
    WHERE f.fecha_emision::date BETWEEN $1 AND $2
  `,

  INGRESOS_POR_METODO_PAGO: `
    SELECT metodo_pago, COUNT(*) AS facturas, SUM(total) AS total
    FROM facturas
    WHERE fecha_emision::date BETWEEN $1 AND $2
    GROUP BY metodo_pago
    ORDER BY total DESC
  `,

  // ── HU-43: Reporte por mecánico ──────────────────────────────────────────
  MECANICOS_ACTIVOS: `
    SELECT u.id, u.nombre_completo
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE r.nombre = 'mecanico' AND u.activo = true
    ORDER BY u.nombre_completo
  `,

  REPORTE_MECANICOS: `
    SELECT
      u.id AS mecanico_id, u.nombre_completo AS mecanico_nombre,
      COUNT(DISTINCT o.numero_orden) FILTER (WHERE o.numero_orden IS NOT NULL) AS ordenes_asignadas,
      COUNT(DISTINCT o.numero_orden) FILTER (WHERE o.estado = 'entregado') AS ordenes_completadas,
      COUNT(os.id) AS servicios_realizados
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    LEFT JOIN ordenes_trabajo o
      ON o.mecanico_id = u.id AND o.fecha_ingreso BETWEEN $1 AND $2
    LEFT JOIN orden_servicio os
      ON os.orden_id = o.numero_orden
    WHERE r.nombre = 'mecanico'
      AND ($3::bigint IS NULL OR u.id = $3::bigint)
    GROUP BY u.id, u.nombre_completo
    ORDER BY ordenes_completadas DESC
  `,

  // ── HU-44: Reporte de órdenes pendientes ─────────────────────────────────
  ORDENES_PENDIENTES: `
    SELECT
      o.numero_orden, o.fecha_ingreso, o.estado, o.prioridad,
      o.descripcion_problema,
      v.placa, v.modelo,
      u.nombre_completo AS mecanico_nombre,
      (current_date - o.fecha_ingreso) AS antiguedad_dias
    FROM ordenes_trabajo o
    JOIN vehiculos v ON v.id = o.vehiculo_id
    LEFT JOIN usuarios u ON u.id = o.mecanico_id
    WHERE o.estado != 'entregado'
      AND ($1::estado_orden IS NULL OR o.estado = $1::estado_orden)
      AND ($2::bigint IS NULL OR o.mecanico_id = $2::bigint)
      AND (current_date - o.fecha_ingreso) >= $3
    ORDER BY o.fecha_ingreso ASC
  `,

  // ── HU-45: Dashboard general (admin + recepcionista) ────────────────────
  DASHBOARD_ORDENES_PROGRESO: `
    SELECT COUNT(*) AS total FROM ordenes_trabajo WHERE estado = 'en reparacion'
  `,
  DASHBOARD_ORDENES_ACTIVAS: `
    SELECT COUNT(*) AS total FROM ordenes_trabajo WHERE estado != 'entregado'
  `,
  DASHBOARD_VEHICULOS_LISTOS: `
    SELECT COUNT(*) AS total FROM ordenes_trabajo WHERE estado = 'listo'
  `,
  DASHBOARD_DIAGNOSTICOS_PENDIENTES: `
    SELECT COUNT(*) AS total FROM diagnosticos WHERE estado IN ('pendiente', 'en proceso')
  `,
  DASHBOARD_ALERTAS_INVENTARIO: `
    SELECT COUNT(*) AS total
    FROM stock_repuestos
    WHERE cantidad_disponible <= cantidad_minima
  `,
  DASHBOARD_TOTAL_CLIENTES: `
    SELECT COUNT(*) AS total FROM clientes
  `,
  DASHBOARD_INGRESOS_MES: `
    SELECT COALESCE(SUM(total), 0) AS total
    FROM facturas
    WHERE date_trunc('month', fecha_emision) = date_trunc('month', now())
  `
};