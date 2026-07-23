const pool = require('../config/db'); // O la ubicación de tu pool (ej. ../db)
const dashboardQueries = require('../constants/queries/dashboardQueries');

const getStats = async (req, res, next) => {
  try {
    const result = await pool.query(dashboardQueries.GET_STATS);
    const row = result.rows[0] || {};

    res.json({
      ordenesProgreso: parseInt(row.ordenes_progreso || 0, 10),
      vehiculosListos: parseInt(row.vehiculos_listos || 0, 10),
      diagnosticosPendientes: parseInt(row.diagnosticos_pendientes || 0, 10),
      alertasInventario: parseInt(row.alertas_inventario || 0, 10)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats
};