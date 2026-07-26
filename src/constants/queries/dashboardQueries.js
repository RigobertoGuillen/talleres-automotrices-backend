module.exports = {
  GET_STATS: `
    SELECT 
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado IN ('recibido', 'en reparacion')) AS ordenes_progreso,
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado = 'listo') AS vehiculos_listos,
      (SELECT COUNT(*) FROM diagnosticos WHERE estado = 'pendiente') AS diagnosticos_pendientes,
      (SELECT COUNT(*) FROM stock_repuestos WHERE cantidad_disponible <= cantidad_minima) AS alertas_inventario
  `,

  GET_ULTIMAS_ORDENES: `
    SELECT o.numero_orden as id, v.placa, v.modelo, 
           CONCAT(c.primer_nombre, ' ', c.primer_apellido) as cliente_nombre,
           o.estado
    FROM ordenes_trabajo o
    JOIN vehiculos v ON o.vehiculo_id = v.id
    JOIN clientes c ON v.cliente_id = c.id
    WHERE o.estado != 'entregado'
    ORDER BY o.fecha_ingreso DESC
    LIMIT 5
  `,

  GET_CARGA_MECANICOS: `
    SELECT u.id, u.nombre_completo,
           COUNT(o.numero_orden) AS ordenes_asignadas
    FROM usuarios u
    LEFT JOIN ordenes_trabajo o ON o.mecanico_id = u.id AND o.estado IN ('recibido', 'en reparacion')
    WHERE u.rol_id = (SELECT id FROM roles WHERE LOWER(nombre) = 'mecanico')
    GROUP BY u.id, u.nombre_completo
    ORDER BY ordenes_asignadas DESC
  `
};