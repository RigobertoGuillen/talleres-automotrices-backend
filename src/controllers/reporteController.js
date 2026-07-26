const ReportesService = require('../services/reporte.service');

const reporteServicios = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReportesService.reporteServicios(fecha_inicio, fecha_fin);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en reporteServicios:', error);
    res.status(500).json({ success: false, message: 'Error al generar el reporte de servicios' });
  }
};

const reporteVehiculosAtendidos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReportesService.reporteVehiculosAtendidos(fecha_inicio, fecha_fin);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en reporteVehiculosAtendidos:', error);
    res.status(500).json({ success: false, message: 'Error al generar el reporte de vehículos atendidos' });
  }
};

const reporteInventarioUtilizado = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReportesService.reporteInventarioUtilizado(fecha_inicio, fecha_fin);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en reporteInventarioUtilizado:', error);
    res.status(500).json({ success: false, message: 'Error al generar el reporte de inventario utilizado' });
  }
};

const reporteIngresos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReportesService.reporteIngresos(fecha_inicio, fecha_fin);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en reporteIngresos:', error);
    res.status(500).json({ success: false, message: 'Error al generar el reporte de ingresos' });
  }
};

const reporteMecanicos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, mecanico_id } = req.query;
    const result = await ReportesService.reporteMecanicos(fecha_inicio, fecha_fin, mecanico_id);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en reporteMecanicos:', error);
    res.status(500).json({ success: false, message: 'Error al generar el reporte por mecánico' });
  }
};

const listarMecanicosActivos = async (req, res) => {
  try {
    const result = await ReportesService.listarMecanicosActivos();
    res.json(result);
  } catch (error) {
    console.error('Error en listarMecanicosActivos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener mecánicos' });
  }
};

const reporteOrdenesPendientes = async (req, res) => {
  try {
    const { estado, mecanico_id, antiguedad_minima } = req.query;
    const result = await ReportesService.reporteOrdenesPendientes({ estado, mecanico_id, antiguedad_minima });
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en reporteOrdenesPendientes:', error);
    res.status(500).json({ success: false, message: 'Error al generar el reporte de órdenes pendientes' });
  }
};

// HU-45: usado tanto por /api/reportes/dashboard como por /api/dashboard/stats
// (alias que ya consumía el frontend existente antes de este módulo).
const dashboardGeneral = async (req, res) => {
  try {
    const result = await ReportesService.dashboardGeneral();
    if (!result.success) return res.status(500).json(result);
    const { success, ...stats } = result;
    res.json(stats);
  } catch (error) {
    console.error('Error en dashboardGeneral:', error);
    res.status(500).json({ message: 'Error al obtener los indicadores del dashboard' });
  }
};

module.exports = {
  reporteServicios,
  reporteVehiculosAtendidos,
  reporteInventarioUtilizado,
  reporteIngresos,
  reporteMecanicos,
  listarMecanicosActivos,
  reporteOrdenesPendientes,
  dashboardGeneral,
};
