const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Ajusta la ruta a tu pool de conexión de pg/PostgreSQL

router.get('/stats', async (req, res) => {
  try {
    // 1. Órdenes en progreso (Filtramos usando el estado exacto de tu BD)
    const ordenesProgreso = await db.query(
      "SELECT COUNT(*) FROM ordenes_trabajo WHERE estado = 'en progreso'"
    );

    // 2. Vehículos por retirar (Órdenes finalizadas listas para entrega)
    const vehiculosListos = await db.query(
      "SELECT COUNT(*) FROM ordenes_trabajo WHERE estado = 'listo para entrega'"
    );

    // 3. Diagnósticos pendientes
    const diagnosticosPendientes = await db.query(
      "SELECT COUNT(*) FROM diagnosticos WHERE estado = 'pendiente'"
    );

    // 4. Alertas de Inventario (Simulado temporalmente en 0 hasta que crees la tabla)
    // Cuando lo tengas, será: "SELECT COUNT(*) FROM inventario WHERE stock_actual <= stock_minimo"
    const alertasInventario = 0; 

    res.json({
      ordenesProgreso: parseInt(ordenesProgreso.rows[0].count || 0, 10),
      vehiculosListos: parseInt(vehiculosListos.rows[0].count || 0, 10),
      diagnosticosPendientes: parseInt(diagnosticosPendientes.rows[0].count || 0, 10),
      alertasInventario: alertasInventario
    });

  } catch (error) {
    console.error("Error en dashboard stats:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

module.exports = router;