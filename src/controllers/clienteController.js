const ClienteService = require('../services/cliente.service');

const getClientes = async (req, res) => {
  try {
    const result = await ClienteService.getAll();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes'
    });
  }
};

const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ClienteService.getById(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente'
    });
  }
};

const getClienteByDni = async (req, res) => {
  try {
    const { dni } = req.params;
    const result = await ClienteService.getByDni(dni);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar cliente por DNI'
    });
  }
};

const buscarClientes = async (req, res) => {
  try {
    const { q } = req.query;
    const result = await ClienteService.searchByNombre(q);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar clientes'
    });
  }
};

const createCliente = async (req, res) => {
  try {
    const result = await ClienteService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente'
    });
  }
};

const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ClienteService.update(id, req.body);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente'
    });
  }
};

const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ClienteService.delete(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente'
    });
  }
};

const getHistorialCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;
    const result = await ClienteService.getHistorial(id, fecha_inicio, fecha_fin);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  getClienteByDni,
  buscarClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getHistorialCliente
};