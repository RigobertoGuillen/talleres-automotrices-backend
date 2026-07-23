const setupDatabase = require('../src/config/setupDatabase');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function migrarSolicitudes() {
  try {
    await pool.query(`
      ALTER TABLE solicitudes_repuestos 
      ADD COLUMN IF NOT EXISTS estado varchar(20) DEFAULT 'pendiente' 
      CHECK (estado IN ('pendiente', 'aprobada', 'rechazada'))
    `);

    await pool.query(`
      ALTER TABLE solicitudes_repuestos 
      ADD COLUMN IF NOT EXISTS aprobado_por bigint REFERENCES usuarios(id)
    `);

    await pool.query(`
      ALTER TABLE solicitudes_repuestos 
      ADD COLUMN IF NOT EXISTS fecha_aprobacion timestamptz
    `);

    console.log('Columnas de solicitudes_repuestos migradas');
  } catch (error) {
    console.log('Error migrando solicitudes_repuestos:', error.message);
  }
}

async function crearUsuariosPrueba() {
  const usuarios = [
    { nombre: 'Ana Lopez', usuario: 'alopez', email: 'alopez@taller.com', rol: 'recepcionista' },
    { nombre: 'Carlos Mendoza', usuario: 'cmendoza', email: 'cmendoza@taller.com', rol: 'administrador' },
    { nombre: 'Jose Martinez', usuario: 'jmartinez', email: 'jmartinez@taller.com', rol: 'mecanico' },
    { nombre: 'Maria Rodriguez', usuario: 'mrodriguez', email: 'mrodriguez@taller.com', rol: 'mecanico' },
    { nombre: 'Luis Fernandez', usuario: 'lfernandez', email: 'lfernandez@taller.com', rol: 'mecanico' }
  ];

  for (const user of usuarios) {
    const existe = await pool.query(
      `SELECT id FROM usuarios WHERE nombre_usuario = $1`,
      [user.usuario]
    );

    if (existe.rows.length > 0) continue;

    const rolResult = await pool.query(
      `SELECT id FROM roles WHERE nombre = $1`,
      [user.rol]
    );
    const rolId = rolResult.rows[0]?.id || 3;

    const hash = await bcrypt.hash(`${user.usuario}123`, 10);

    await pool.query(
      `INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [user.nombre, user.usuario, user.email, hash, rolId]
    );

    console.log(`Usuario ${user.usuario} creado (${user.rol})`);
  }
}

module.exports = async () => {
  console.log('\n--- Inicializando Base de Datos para Entorno de Pruebas ---');

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_entorno_de_pruebas_123';
  process.env.NODE_ENV = 'test';

  try {
    await setupDatabase();

    await migrarSolicitudes();

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

    await crearUsuariosPrueba();

    console.log(' Base de Datos Inicializada Correctamente\n');

  } catch (error) {
    console.error('Error en setup:', error.message);
    throw error;
  }
};