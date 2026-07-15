// tests/setup.js
const setupDatabase = require('../src/config/setupDatabase');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  // 1. Forzar variables de entorno por defecto para GitHub Actions / CI
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_entorno_de_pruebas_123';
  process.env.NODE_ENV = 'test';

  console.log('\n--- Inicializando Base de Datos para Entorno de Pruebas ---');
  
  // 2. Ejecutar la migración de las tablas e inserción de datos iniciales
  await setupDatabase();
  
  try {
  const hashContrasena = await bcrypt.hash('admin123', 10);

  await pool.query(
    `DELETE FROM usuarios
     WHERE nombre_usuario = $1`,
    ['admin']
  );

  await pool.query(
    `INSERT INTO usuarios
    (
      nombre_completo,
      nombre_usuario,
      correo,
      contrasena_hash,
      rol_id,
      activo
    )
    VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      'Administrador',
      'admin',
      'admin@taller.com',
      hashContrasena,
      1,
      true
    ]
  );

  console.log('✔ Usuario administrador de pruebas creado.');
}
catch(err){
  console.error(err);
}

  console.log('--- Base de Datos Inicializada Correctamente ---\n');
};