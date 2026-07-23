module.exports = {
  GET_STATS: `
    SELECT 
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado IN ('recibido', 'en reparacion')) AS ordenes_progreso,
      (SELECT COUNT(*) FROM ordenes_trabajo WHERE estado = 'listo') AS vehiculos_listos,
      (SELECT COUNT(*) FROM diagnosticos WHERE estado = 'pendiente') AS diagnosticos_pendientes,
      (SELECT COUNT(*) FROM stock_repuestos WHERE cantidad_disponible <= cantidad_minima) AS alertas_inventario
  `
};