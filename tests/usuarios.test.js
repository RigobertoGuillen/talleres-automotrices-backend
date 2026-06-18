const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs'); // O 'bcrypt'

describe('Usuarios Endpoints', () => {
  let token;

  beforeAll(async () => {
    try {
      await pool.query("DELETE FROM usuarios WHERE nombre_usuario = 'admin'");
      
      await pool.query(`
        INSERT INTO roles (id, nombre, descripcion) 
        OVERRIDING SYSTEM VALUE
        VALUES (1, 'administrador', 'Acceso total al sistema')
        ON CONFLICT (id) DO NOTHING;
      `);

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);

      await pool.query(`
        INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (nombre_usuario) DO NOTHING;
      `, ['Administrador Principal', 'admin', 'admin@sigta.com', hash, 1]);

      console.log('Semilla blindada de ADMIN inyectada con éxito con hash real');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          nombre_usuario: 'admin',
          contrasena: 'admin123'
        });
      
      token = response.body.token;
    } catch (err) {
      console.error('Error crítico en inyección beforeAll:', err);
    }
  });

  // ... Resto de tus pruebas de usuarios idénticas
});