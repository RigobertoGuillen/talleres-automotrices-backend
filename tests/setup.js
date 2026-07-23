const setupDatabase = require('../src/config/setupDatabase');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  console.log('\nInicializando Base de Datos para Entorno de Pruebas');

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_entorno_de_pruebas_123';
  process.env.NODE_ENV = 'test';

  try {
    await setupDatabase();

    const adminCheck = await pool.query(
      `SELECT id FROM usuarios WHERE nombre_usuario = $1`,
      ['admin']
    );

    if (adminCheck.rows.length === 0) {
      const hashContrasena = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Administrador', 'admin', 'admin@taller.com', hashContrasena, 1, true]
      );
      console.log('Usuario administrador de pruebas creado.');
    } else {
      console.log('Usuario administrador de pruebas ya existe.');
    }

    console.log('Base de Datos Inicializada Correctamente \n');

  } catch (error) {
    console.error('Error en setup:', error.message);
    throw error;
  }
};