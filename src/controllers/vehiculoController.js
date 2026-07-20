const VehiculoService = require('../services/vehiculo.service');

const crearVehiculo = async (req, res) => {
  try {
    const result = await VehiculoService.create(req.body);
    
    if (!result.success) {
      const validationErrors = [
        'Todos los campos obligatorios deben enviarse',
        'Año inválido',
        'Tipo de vehículo inválido',
        'Ya existe un vehículo con esta placa'
      ];
      const status = validationErrors.some(msg => result.message && result.message.includes(msg)) ? 400 : 500;
      return res.status(status).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar vehículo'
    });
  }
};

const actualizarVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await VehiculoService.update(id, req.body);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar vehículo'
    });
  }
};

const obtenerVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await VehiculoService.getById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar vehículo'
    });
  }
};

const listarVehiculos = async (req, res) => {
  try {
    const result = await VehiculoService.getAll();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al listar vehículos'
    });
  }
};

const listarMarcas = async (req, res) => {
  try {
    const result = await VehiculoService.getAllMarcas();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al listar marcas'
    });
  }
};

const buscarVehiculos = async (req, res) => {
  try {
    const { q } = req.query;
    const result = await VehiculoService.search(q);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar vehículos'
    });
  }
};

const listarVehiculosPorCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await VehiculoService.getByCliente(id);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los vehículos del cliente'
    });
  }
};

const historialVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await VehiculoService.getHistorial(id);
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
  crearVehiculo,
  actualizarVehiculo,
  obtenerVehiculo,
  listarVehiculos,
  listarMarcas,
  buscarVehiculos,
  historialVehiculo,
  listarVehiculosPorCliente
};