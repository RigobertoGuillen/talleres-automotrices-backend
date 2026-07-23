const OrdenService = require('../services/orden.service');

const createOrden = async (req, res) => {
  try {
    const result = await OrdenService.create(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden de trabajo'
    });
  }
};

const getOrdenById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrdenService.getById(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden'
    });
  }
};

const getOrdenes = async (req, res) => {
  try {
    const { estado, mecanico_id, cliente_id, fecha_inicio, fecha_fin } = req.query;
    const result = await OrdenService.getAll({
      estado,
      mecanico_id,
      cliente_id,
      fecha_inicio,
      fecha_fin
    });
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes'
    });
  }
};

const asignarMecanico = async (req, res) => {
  try {
    const { id } = req.params;
    const { mecanico_id } = req.body;
    const result = await OrdenService.asignarMecanico(id, mecanico_id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar mecánico'
    });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;
    const usuario_id = req.usuario.id;
    const result = await OrdenService.actualizarEstado(id, estado, notas, usuario_id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado'
    });
  }
};

const cerrarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;
    const result = await OrdenService.cerrar(id, usuario_id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar orden'
    });
  }
};

const getOrdenesByMecanico = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrdenService.getByMecanico(id);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes del mecánico'
    });
  }
};

const reasignarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const { mecanico_id } = req.body;
    const usuario_id = req.usuario.id;
    const result = await OrdenService.reasignar(id, mecanico_id, usuario_id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reasignar orden'
    });
  }
};

module.exports = {
  createOrden,
  getOrdenById,
  getOrdenes,
  asignarMecanico,
  actualizarEstado,
  cerrarOrden,
  getOrdenesByMecanico,
  reasignarOrden
};