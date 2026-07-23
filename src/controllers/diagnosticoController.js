const DiagnosticoService = require('../services/diagnostico.service');

const crearDiagnostico = async (req, res) => {
  try {
    const result = await DiagnosticoService.create({
      ...req.body,
      mecanico_id: req.body.mecanico_id || req.usuario.id
    });
    
    if (!result.success) {
      if (result.message && result.message.includes('no existe')) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en crearDiagnostico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar diagnóstico'
    });
  }
};

const listarDiagnosticos = async (req, res) => {
  try {
    const { estado, q, orden_id, orden } = req.query;
    const result = await DiagnosticoService.getAll({ estado, q, orden_id, orden });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en listarDiagnosticos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar diagnósticos'
    });
  }
};

const obtenerDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DiagnosticoService.getById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en obtenerDiagnostico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar diagnóstico'
    });
  }
};

const listarDiagnosticosPorOrden = async (req, res) => {
  try {
    const { ordenId } = req.params;
    const result = await DiagnosticoService.getByOrden(ordenId);
    
    if (!result.success) {
      if (result.message && result.message.includes('no existe')) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en listarDiagnosticosPorOrden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar el historial de diagnósticos'
    });
  }
};

const actualizarDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DiagnosticoService.update(id, req.body);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en actualizarDiagnostico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar diagnóstico'
    });
  }
};

const actualizarObservaciones = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const result = await DiagnosticoService.updateObservaciones(id, observaciones);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en actualizarObservaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar observaciones'
    });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const result = await DiagnosticoService.updateEstado(id, estado);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en actualizarEstado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del diagnóstico'
    });
  }
};

module.exports = {
  crearDiagnostico,
  listarDiagnosticos,
  obtenerDiagnostico,
  listarDiagnosticosPorOrden,
  actualizarDiagnostico,
  actualizarObservaciones,
  actualizarEstado
};