const ReporteService = require('../services/reporte.service');

const getServiciosRealizados = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReporteService.getServiciosRealizados(fecha_inicio, fecha_fin);
    res.json(result);
  } catch (error) {
    console.error('Error en getServiciosRealizados:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte de servicios' });
  }
};

const getVehiculosAtendidos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReporteService.getVehiculosAtendidos(fecha_inicio, fecha_fin);
    res.json(result);
  } catch (error) {
    console.error('Error en getVehiculosAtendidos:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte de vehículos' });
  }
};

const getRepuestosUtilizados = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReporteService.getRepuestosUtilizados(fecha_inicio, fecha_fin);
    res.json(result);
  } catch (error) {
    console.error('Error en getRepuestosUtilizados:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte de repuestos' });
  }
};

const getIngresos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReporteService.getIngresos(fecha_inicio, fecha_fin);
    res.json(result);
  } catch (error) {
    console.error('Error en getIngresos:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte de ingresos' });
  }
};

const getPorMecanico = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ReporteService.getPorMecanico(fecha_inicio, fecha_fin);
    res.json(result);
  } catch (error) {
    console.error('Error en getPorMecanico:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte por mecánico' });
  }
};

const getOrdenesPendientes = async (req, res) => {
  try {
    const { estado } = req.query;
    const result = await ReporteService.getOrdenesPendientes(estado || '');
    res.json(result);
  } catch (error) {
    console.error('Error en getOrdenesPendientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener órdenes pendientes' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const result = await ReporteService.getDashboard();
    res.json(result);
  } catch (error) {
    console.error('Error en getDashboard:', error);
    res.status(500).json({ success: false, message: 'Error al obtener dashboard' });
  }
};

module.exports = {
  getServiciosRealizados,
  getVehiculosAtendidos,
  getRepuestosUtilizados,
  getIngresos,
  getPorMecanico,
  getOrdenesPendientes,
  getDashboard
};