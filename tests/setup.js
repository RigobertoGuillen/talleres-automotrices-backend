const setupDatabase = require('../src/config/setupDatabase');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  console.log('\n--- Inicializando Base de Datos para Entorno de Pruebas ---');

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_entorno_de_pruebas_123';
  process.env.NODE_ENV = 'test';

  try {
    await setupDatabase();

    const hashContrasena = await bcrypt.hash('admin123', 10);

    await pool.query(`DELETE FROM usuarios WHERE nombre_usuario = $1`, ['admin']);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre_usuario`,
      ['Administrador', 'admin', 'admin@taller.com', hashContrasena, 1, true]
    );

    console.log(`✔ Usuario administrador de pruebas creado (ID: ${result.rows[0].id})`);
    console.log('--- Base de Datos Inicializada Correctamente ---\n');

  } catch (error) {
    console.error('Error en setup:', error.message);
    throw error;
  }
};