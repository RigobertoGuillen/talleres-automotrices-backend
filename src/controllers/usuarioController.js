const UsuarioService = require('../services/usuario.service');

const getUsuarios = async (req, res) => {
  try {
    const result = await UsuarioService.getAll();
    res.json(result);
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UsuarioService.getById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
};

const createUsuario = async (req, res) => {
  try {
    const result = await UsuarioService.create(req.body);
    
    if (!result.success) {
      const validationErrors = [
        'Todos los campos son obligatorios',
        'El campo nombre_usuario es obligatorio',
        'El campo correo es obligatorio',
        'El campo contrasena es obligatorio',
        'El nombre de usuario ya existe',
        'El correo ya está registrado'
      ];
      const status = validationErrors.some(msg => result.message && result.message.includes(msg)) ? 400 : 500;
      return res.status(status).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en createUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    });
  }
};

const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UsuarioService.update(id, req.body);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en updateUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario'
    });
  }
};

const toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    const result = await UsuarioService.toggleStatus(id, activo);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en toggleEstado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario'
    });
  }
};

const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UsuarioService.delete(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  toggleEstado,
  deleteUsuario
};