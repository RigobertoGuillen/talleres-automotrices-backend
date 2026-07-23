const BaseService = require('./base.service');
const UsuarioRepository = require('../repositories/usuario.repository');
const TokenRepository = require('../repositories/token.repository');
const EmailService = require('./email.service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const JWT_SECRET = require('../config/jwt');
const ERROR_MESSAGES = require('../constants/messages/errorMessages');
const SUCCESS_MESSAGES = require('../constants/messages/successMessages');

class AuthService extends BaseService {
  constructor() {
    super(UsuarioRepository);
    this.tokenRepository = TokenRepository;
    this.emailService = new EmailService();
    this.JWT_SECRET = JWT_SECRET;
  }

  async login(nombre_usuario, contrasena) {
    try {
      if (!nombre_usuario || !contrasena) {
        return { success: false, message: 'Usuario y contraseña son obligatorios' };
      }

      const usuario = await this.repository.findByUsername(nombre_usuario);
      if (!usuario) {
        return { success: false, message: ERROR_MESSAGES.CREDENCIALES_INVALIDAS };
      }

      if (!usuario.activo) {
        return { success: false, message: ERROR_MESSAGES.USUARIO_INACTIVO };
      }

      const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
      if (!passwordValida) {
        return { success: false, message: ERROR_MESSAGES.CREDENCIALES_INVALIDAS };
      }

      const token = jwt.sign(
        { id: usuario.id, nombre_usuario: usuario.nombre_usuario, rol: usuario.rol },
        this.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return {
        success: true,
        token,
        usuario: {
          id: usuario.id,
          nombre_completo: usuario.nombre_completo,
          nombre_usuario: usuario.nombre_usuario,
          correo: usuario.correo,
          rol: usuario.rol
        }
      };
    } catch (error) {
      console.error('Error en AuthService.login:', error.message);
      return { success: false, message: error.message || 'Error interno del servidor' };
    }
  }

  async solicitarRecuperacion(email) {
    try {
      if (!email) {
        return { success: false, message: 'Email es obligatorio' };
      }

      const usuario = await this.repository.findByEmail(email);
      if (!usuario) {
        return { success: false, message: 'No existe un usuario con este email' };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const token_hash = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 3600000);

      await this.tokenRepository.deleteByUser(usuario.id);
      await this.tokenRepository.create(usuario.id, token_hash, expiresAt);

      await this.emailService.sendRecoveryEmail(email, token);

      return {
        success: true,
        message: SUCCESS_MESSAGES.EMAIL_ENVIADO
      };
    } catch (error) {
      console.error('Error en AuthService.solicitarRecuperacion:', error.message);
      return { success: false, message: error.message || 'Error al procesar la solicitud' };
    }
  }

  async restablecerPassword(token, nueva_contrasena) {
    try {
      if (!token || !nueva_contrasena) {
        return { success: false, message: 'Token y nueva contraseña son obligatorios' };
      }

      const tokens = await this.tokenRepository.findAllActive();
      
      let tokenRecord = null;
      for (const t of tokens) {
        const esValido = await bcrypt.compare(token, t.token_hash);
        if (esValido) {
          tokenRecord = t;
          break;
        }
      }

      if (!tokenRecord) {
        return { success: false, message: ERROR_MESSAGES.TOKEN_INVALIDO };
      }

      const usuario = await this.repository.findById(tokenRecord.usuario_id);
      if (!usuario) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(nueva_contrasena, salt);

      await this.repository.updatePassword(usuario.id, hash);
      await this.tokenRepository.markAsUsed(tokenRecord.token_hash);

      return {
        success: true,
        message: SUCCESS_MESSAGES.CONTRASENA_ACTUALIZADA
      };
    } catch (error) {
      console.error('Error en AuthService.restablecerPassword:', error.message);
      return { success: false, message: error.message || 'Error al restablecer la contraseña' };
    }
  }

  async register(usuarioData) {
    try {
      const { nombre_completo, nombre_usuario, correo, contrasena, rol_id } = usuarioData;

      if (!nombre_completo || !nombre_usuario || !correo || !contrasena) {
        return { success: false, message: 'Todos los campos son obligatorios' };
      }

      const existe = await this.repository.findByUsername(nombre_usuario);
      if (existe) {
        return { success: false, message: ERROR_MESSAGES.USUARIO_YA_EXISTE };
      }

      const existeEmail = await this.repository.findByEmail(correo);
      if (existeEmail) {
        return { success: false, message: ERROR_MESSAGES.EMAIL_YA_REGISTRADO };
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

      return {
        success: true,
        message: SUCCESS_MESSAGES.USUARIO_CREADO,
        data: usuario
      };
    } catch (error) {
      console.error('Error en AuthService.register:', error.message);
      return { success: false, message: error.message || 'Error interno del servidor' };
    }
  }
}

module.exports = new AuthService();