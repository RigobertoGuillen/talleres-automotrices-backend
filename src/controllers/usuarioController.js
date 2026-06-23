
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: usuario });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuario' });
  }
};
const createUsuario = async (req, res) => {
  try {
    const { nombre_completo, nombre_usuario, correo, contrasena, rol_id } = req.body;
    if (!nombre_completo || !nombre_usuario || !correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    const usuario = await Usuario.create({
      nombre_completo,
      nombre_usuario,
      correo,
      contrasena,
      rol_id: rol_id || 3
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: usuario
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
};
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, correo, contrasena, rol_id } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const updated = await Usuario.update(id, {
      nombre_completo: nombre_completo || usuario.nombre_completo,
      correo: correo || usuario.correo,
      contrasena: contrasena || usuario.contrasena_hash,
      rol_id: rol_id || usuario.rol_id
    });

    res.json({
      success: true,
      message: 'Usuario actualizado',
      data: updated
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
  }
};

const toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({ success: false, message: 'El campo activo es obligatorio' });
    }

    const usuario = await Usuario.toggleStatus(id, activo);

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'}`,
      data: usuario
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar estado' });
  }
};

const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await Usuario.delete(id);

    res.json({ success: true, message: 'Usuario eliminado' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
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