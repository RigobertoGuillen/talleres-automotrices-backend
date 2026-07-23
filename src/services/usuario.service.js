const BaseService = require('./base.service');
const UsuarioRepository = require('../repositories/usuario.repository');
const bcrypt = require('bcryptjs');

class UsuarioService extends BaseService {
  constructor() {
    super(UsuarioRepository);
  }

  async getAll() {
    try {
      const usuarios = await this.repository.findAll();
      return { success: true, data: usuarios };
    } catch (error) {
      console.error('Error en UsuarioService.getAll:', error.message);
      return { success: false, message: error.message || 'Error al obtener usuarios' };
    }
  }

  async getById(id) {
    try {
      const usuario = await this.repository.findById(id);
      if (!usuario) {
        return { success: false, message: 'Usuario no encontrado' };
      }
      return { success: true, data: usuario };
    } catch (error) {
      console.error('Error en UsuarioService.getById:', error.message);
      return { success: false, message: error.message || 'Error al obtener usuario' };
    }
  }

  async create(usuarioData) {
    try {
      const { nombre_completo, nombre_usuario, correo, contrasena, rol_id } = usuarioData;

      if (!nombre_completo || !nombre_usuario || !correo || !contrasena) {
        return { success: false, message: 'Todos los campos son obligatorios' };
      }

      const existe = await this.repository.findByUsername(nombre_usuario);
      if (existe) {
        return { success: false, message: 'El nombre de usuario ya existe' };
      }

      const existeEmail = await this.repository.findByEmail(correo);
      if (existeEmail) {
        return { success: false, message: 'El correo ya está registrado' };
      }

      const salt = await bcrypt.genSalt(10);
      const contrasena_hash = await bcrypt.hash(contrasena, salt);

      const usuario = await this.repository.create({
        nombre_completo,
        nombre_usuario,
        correo,
        contrasena_hash,
        rol_id: rol_id || 3
      });

      return { success: true, message: 'Usuario creado correctamente', data: usuario };
    } catch (error) {
      console.error('Error en UsuarioService.create:', error.message);
      return { success: false, message: error.message || 'Error al crear usuario' };
    }
  }

  async update(id, data) {
    try {
      const usuarioExistente = await this.repository.findById(id);
      if (!usuarioExistente) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      let contrasena_hash = usuarioExistente.contrasena_hash;
      if (data.contrasena) {
        const salt = await bcrypt.genSalt(10);
        contrasena_hash = await bcrypt.hash(data.contrasena, salt);
      }

      const usuario = await this.repository.update(id, {
        nombre_completo: data.nombre_completo || usuarioExistente.nombre_completo,
        correo: data.correo || usuarioExistente.correo,
        contrasena_hash,
        rol_id: data.rol_id || usuarioExistente.rol_id
      });

      return { success: true, message: 'Usuario actualizado correctamente', data: usuario };
    } catch (error) {
      console.error('Error en UsuarioService.update:', error.message);
      return { success: false, message: error.message || 'Error al actualizar usuario' };
    }
  }

  async toggleStatus(id, activo) {
    try {
      if (activo === undefined) {
        return { success: false, message: 'El campo activo es obligatorio' };
      }

      const usuario = await this.repository.toggleStatus(id, activo);
      if (!usuario) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      return { success: true, message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`, data: usuario };
    } catch (error) {
      console.error('Error en UsuarioService.toggleStatus:', error.message);
      return { success: false, message: error.message || 'Error al cambiar estado del usuario' };
    }
  }

  async delete(id) {
    try {
      const usuario = await this.repository.findById(id);
      if (!usuario) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      await this.repository.delete(id);
      return { success: true, message: 'Usuario eliminado correctamente' };
    } catch (error) {
      console.error('Error en UsuarioService.delete:', error.message);
      return { success: false, message: error.message || 'Error al eliminar usuario' };
    }
  }
}

module.exports = new UsuarioService();