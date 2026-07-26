const getOrdenesRecientes = async (req, res) => {
  try {
    const result = await pool.query(dashboardQueries.ORDENES_RECIENTES);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener órdenes recientes' });
  }
};

const getCargaMecanicos = async (req, res) => {
  try {
    const result = await pool.query(dashboardQueries.CARGA_MECANICOS);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener carga de mecánicos' });
  }
};

const getAlertas = async (req, res) => {
  try {
    const [stockResult, retrasadasResult] = await Promise.all([
      pool.query(dashboardQueries.ALERTAS_STOCK),
      pool.query(dashboardQueries.ORDENES_RETRASADAS),
    ]);

    const alertas = [
      ...stockResult.rows.map((r) => ({
        tipo: 'stock',
        mensaje: `${r.nombre} con stock bajo (${r.cantidad_disponible}/${r.cantidad_minima})`,
      })),
      ...retrasadasResult.rows.map((r) => ({
        tipo: 'orden_retrasada',
        mensaje: `Orden ${r.numero_orden} retrasada — ingresó el ${new Date(
          r.fecha_ingreso
        ).toLocaleDateString('es-HN')}`,
      })),
    ];

    res.json(alertas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener alertas' });
  }
};

module.exports = {
  getStats,
  getOrdenesRecientes,
  getCargaMecanicos,
  getAlertas,
};