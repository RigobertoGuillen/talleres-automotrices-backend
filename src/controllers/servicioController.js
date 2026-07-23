const ServicioService = require('../services/servicio.service');

// SRP: el controller solo traduce HTTP <-> ServicioService (recibe request,
// llama al service, devuelve response); no contiene reglas de negocio ni SQL.
const getServicios = async (req, res) => {
  try {
    const result = await ServicioService.servicioGetAll();
    res.json(result);
  } catch (error) {
    console.error('Error en getServicios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener servicios' });
  }
};

const getServicioById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ServicioService.servicioGetById(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en getServicioById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener servicio' });
  }
};

const createServicio = async (req, res) => {
  try {
    const result = await ServicioService.servicioCreate(req.body);
    if (!result.success) {
      const status = result.message.includes('obligatorio') || result.message.includes('existe') ? 400 : 500;
      return res.status(status).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en createServicio:', error);
    res.status(500).json({ success: false, message: 'Error al crear servicio' });
  }
};

const updateServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ServicioService.servicioUpdate(id, req.body);
    if (!result.success) {
      const status = result.message.includes('no encontrado') ? 404
        : result.message.includes('obligatorio') || result.message.includes('existe') ? 400
        : 500;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error en updateServicio:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar servicio' });
  }
};

const deleteServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ServicioService.servicioDelete(id);
    if (!result.success) {
      const status = result.message.includes('no encontrado') ? 404
        : result.message.includes('aplicado') ? 400
        : 500;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error en deleteServicio:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar servicio' });
  }
};

module.exports = {
  getServicios,
  getServicioById,
  createServicio,
  updateServicio,
  deleteServicio
};
