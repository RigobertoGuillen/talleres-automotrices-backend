const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false },
      family: 4
    });
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  async sendRecoveryEmail(email, token) {
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.EMAIL_USER || 'sistema@sigta.com',
      to: email,
      subject: 'SIGTA - Recuperación de contraseña',
      html: this._getRecoveryEmailTemplate(resetLink)
    });
  }

  _getRecoveryEmailTemplate(link) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: #2563eb;">SIGTA</h1>
        <h2>Recuperación de contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Restablecer contraseña
        </a>
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Este enlace expirará en <strong>1 hora</strong>.
        </p>
        <p style="font-size: 14px; color: #666;">
          Si no solicitaste este cambio, ignora este mensaje.
        </p>
      </div>
    `;
  }
}

module.exports = EmailService;