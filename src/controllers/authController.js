const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');
const TokenRecuperacion = require('../models/TokenRecuperacion');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'talleres_automotrices';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const login = async (req, res) => {
  try {
    const { nombre_usuario, contrasena } = req.body;

    if (!nombre_usuario || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son obligatorios'
      });
    }

    const usuario = await Usuario.findByUsername(nombre_usuario);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      usuario: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        nombre_usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
const register = async (req, res) => {
  try {
    const { nombre_completo, nombre_usuario, correo, contrasena, rol } = req.body;

    if (!nombre_completo || !nombre_usuario || !correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    const existe = await Usuario.findByUsername(nombre_usuario);
    if (existe) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    const existeEmail = await Usuario.findByEmail(correo);
    if (existeEmail) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contrasena, salt);

    const usuario = await Usuario.create({
      nombre_completo,
      nombre_usuario,
      correo,
      contrasena: hash,
      rol: rol || 'recepcionista'
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: usuario
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es obligatorio'
      });
    }

    const usuario = await Usuario.findByEmail(email);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'No existe un usuario con este email'
      });
    }

    const token = jwt.sign(
      { email: usuario.email, id: usuario.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await TokenRecuperacion.deleteByEmail(email);

    const expiresAt = new Date(Date.now() + 3600000);
    await TokenRecuperacion.create(email, token, expiresAt);

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    console.log('🔗 Enlace de recuperación:', resetLink);

    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'sistema@sigta.com',
      to: email,
      subject: 'SIGTA - Recuperación de contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #2563eb;">SIGTA</h1>
          <h2>Recuperación de contraseña</h2>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Restablecer contraseña
          </a>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Este enlace expirará en <strong>1 hora</strong>.
          </p>
          <p style="font-size: 14px; color: #666;">
            Si no solicitaste este cambio, ignora este mensaje.
          </p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Se ha enviado un enlace de recuperación a tu correo'
    });

  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

const restablecerPassword = async (req, res) => {
  try {
    const { token, nueva_contrasena } = req.body;

    if (!token || !nueva_contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son obligatorios'
      });
    }

    const tokenRecord = await TokenRecuperacion.findByToken(token);
    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    if (decoded.email !== tokenRecord.email) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const usuario = await Usuario.findByEmail(tokenRecord.email);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(nueva_contrasena, salt);

    await pool.query(
      'UPDATE usuarios SET contrasena_hash = $1, fecha_actualizacion = NOW() WHERE id = $2',
      [hash, usuario.id]
    );

    await TokenRecuperacion.markAsUsed(token);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error en restablecerPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña'
    });
  }
};

module.exports = {
  login,
  register,
  solicitarRecuperacion,
  restablecerPassword
};