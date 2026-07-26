const pool = require('../config/db');
const dashboardQueries = require('../constants/queries/dashboardQueries');

const getStats = async (req, res, next) => {
  try {
    const statsResult = await pool.query(dashboardQueries.GET_STATS);
    const ultimasResult = await pool.query(dashboardQueries.GET_ULTIMAS_ORDENES);
    const cargaResult = await pool.query(dashboardQueries.GET_CARGA_MECANICOS);

    const row = statsResult.rows[0] || {};

    res.json({
      ordenesProgreso: parseInt(row.ordenes_progreso || 0, 10),
      vehiculosListos: parseInt(row.vehiculos_listos || 0, 10),
      diagnosticosPendientes: parseInt(row.diagnosticos_pendientes || 0, 10),
      alertasInventario: parseInt(row.alertas_inventario || 0, 10),
      ultimasOrdenes: ultimasResult.rows,
      cargaMecanicos: cargaResult.rows,
      alertasCriticas: [
        // Puedes agregar lógica para consultar repuestos sin stock
      ]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };