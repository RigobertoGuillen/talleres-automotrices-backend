const pool = require('./db');
const bcrypt = require('bcryptjs');

const setupDatabase = async () => {
  const ddl = `
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_nombre') THEN
            CREATE TYPE rol_nombre AS ENUM ('administrador','mecanico','recepcionista');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_vehiculo') THEN
            CREATE TYPE tipo_vehiculo AS ENUM ('Pickup','turismo','camioneta');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_diagnostico') THEN
            CREATE TYPE estado_diagnostico AS ENUM ('pendiente','en proceso','completado');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_orden') THEN
            CREATE TYPE estado_orden AS ENUM ('recibido','en reparacion','listo','entregado');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_factura') THEN
            CREATE TYPE estado_factura AS ENUM ('pagada','pendiente','vencida');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_pago') THEN
            CREATE TYPE metodo_pago AS ENUM ('efectivo','tarjeta','transferencia');
        END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS roles(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre rol_nombre NOT NULL UNIQUE,
        descripcion varchar(200)
    );

    CREATE TABLE IF NOT EXISTS usuarios(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre_completo varchar(150) NOT NULL,
        nombre_usuario varchar(50) NOT NULL UNIQUE,
        correo varchar(150) NOT NULL UNIQUE,
        contrasena_hash varchar(255) NOT NULL,
        rol_id smallint NOT NULL REFERENCES roles(id),
        activo boolean NOT NULL DEFAULT true,
        fecha_creacion timestamptz NOT NULL DEFAULT now(),
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS modulos(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(50) NOT NULL UNIQUE,
        descripcion varchar(150)
    );

    CREATE TABLE IF NOT EXISTS permisos_rol(
        rol_id smallint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        modulo_id smallint NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
        puede_ver boolean NOT NULL DEFAULT false,
        puede_editar boolean NOT NULL DEFAULT false,
        puede_eliminar boolean NOT NULL DEFAULT false,
        PRIMARY KEY (rol_id, modulo_id)
    );

    CREATE TABLE IF NOT EXISTS direcciones(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        calle varchar(150) NOT NULL,
        colonia varchar(100) NOT NULL,
        ciudad varchar(80) NOT NULL,
        departamento varchar(80) NOT NULL,
        referencia text
    );

    CREATE TABLE IF NOT EXISTS clientes(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        dni varchar(13) NOT NULL UNIQUE CHECK (dni ~ '^[0-9]{13}$'),
        primer_nombre varchar(150) NOT NULL,
        segundo_nombre varchar(150) NULL,
        primer_apellido varchar(150) NOT NULL,
        segundo_apellido varchar(150) NOT NULL,
        telefono varchar(150) NOT NULL,
        correo varchar(150),
        direccion_id bigint REFERENCES direcciones(id) ON DELETE SET NULL,
        fecha_registro timestamptz NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS clientes_dni_unico
        ON clientes (lower(dni))
        WHERE dni IS NOT NULL;

    CREATE TABLE IF NOT EXISTS auditoria_clientes (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        cliente_id bigint NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
        campo_modificado varchar(50) NOT NULL,
        valor_anterior text,
        valor_nuevo text,
        fecha_hora timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS auditoria_clientes_idx ON auditoria_clientes(cliente_id);

    CREATE TABLE IF NOT EXISTS marcas_vehiculo(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(50) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS vehiculos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        placa varchar(15) NOT NULL UNIQUE,
        marca_id smallint NOT NULL REFERENCES marcas_vehiculo(id),
        modelo varchar(50) NOT NULL,
        anio smallint NOT NULL
            CHECK (anio BETWEEN 1950 AND extract(year FROM now())::int + 1),
        color varchar(30),
        tipo tipo_vehiculo NOT NULL,
        cliente_id bigint NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
        fecha_registro timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS vehiculos_clientes_idx ON vehiculos(cliente_id);
    CREATE INDEX IF NOT EXISTS vehiculos_marca_idx ON vehiculos(marca_id);

    CREATE TABLE IF NOT EXISTS ordenes_trabajo(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        numero_orden varchar(20) UNIQUE,
        vehiculo_id bigint NOT NULL REFERENCES vehiculos(id),
        mecanico_id bigint REFERENCES usuarios(id),
        fecha_ingreso date NOT NULL DEFAULT current_date,
        descripcion_problema text NOT NULL,
        estado estado_orden NOT NULL DEFAULT 'recibido',
        prioridad smallint NOT NULL DEFAULT 0,
        fecha_creacion timestamptz NOT NULL DEFAULT now(),
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS ordenes_estado_idx ON ordenes_trabajo(estado);
    CREATE INDEX IF NOT EXISTS ordenes_mecanico_idx ON ordenes_trabajo(mecanico_id);
    CREATE INDEX IF NOT EXISTS ordenes_vehiculo_idx ON ordenes_trabajo(vehiculo_id);
    CREATE INDEX IF NOT EXISTS ordenes_fecha_idx ON ordenes_trabajo(fecha_ingreso);

    CREATE TABLE IF NOT EXISTS historial_estados_orden(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
        estado estado_orden NOT NULL,
        notas text,
        usuario_id bigint REFERENCES usuarios(id),
        fecha_hora timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS historial_orden_idx ON historial_estados_orden(orden_id);

    CREATE TABLE IF NOT EXISTS diagnosticos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
        descripcion_falla text NOT NULL,
        observaciones text,
        recomendaciones text,
        estado estado_diagnostico NOT NULL DEFAULT 'pendiente',
        mecanico_id bigint REFERENCES usuarios(id),
        fecha_registro timestamptz NOT NULL DEFAULT now(),
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS diagnosticos_orden_idx ON diagnosticos(orden_id);

    CREATE TABLE IF NOT EXISTS categorias_repuestos(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(50) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS repuestos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        codigo varchar(30) NOT NULL UNIQUE,
        nombre varchar(150) NOT NULL,
        categoria_id smallint REFERENCES categorias_repuestos(id),
        precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
        fecha_creacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS repuestos_categoria_idx ON repuestos(categoria_id);

    CREATE TABLE IF NOT EXISTS stock_repuestos(
        repuesto_id bigint PRIMARY KEY REFERENCES repuestos(id) ON DELETE CASCADE,
        cantidad_disponible integer NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
        cantidad_minima integer NOT NULL DEFAULT 0 CHECK (cantidad_minima >= 0),
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS movimientos_inventario(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        repuesto_id bigint NOT NULL REFERENCES repuestos(id),
        tipo_movimiento varchar(10) NOT NULL CHECK (tipo_movimiento IN ('entrada','salida')),
        cantidad integer NOT NULL CHECK (cantidad > 0),
        motivo varchar(100),
        orden_id bigint REFERENCES ordenes_trabajo(id),
        usuario_id bigint REFERENCES usuarios(id),
        fecha_hora timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS mov_inventario_repuesto_idx ON movimientos_inventario(repuesto_id);
    CREATE INDEX IF NOT EXISTS mov_inventario_orden_idx ON movimientos_inventario(orden_id);

    CREATE TABLE IF NOT EXISTS solicitudes_repuestos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
        repuesto_id bigint NOT NULL REFERENCES repuestos(id),
        cantidad_solicitada integer NOT NULL CHECK (cantidad_solicitada > 0),
        precio_historico numeric(10,2) NOT NULL,
        mecanico_id bigint REFERENCES usuarios(id),
        fecha_solicitud timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS solicitudes_orden_idx ON solicitudes_repuestos(orden_id);
    CREATE INDEX IF NOT EXISTS solicitudes_repuesto_idx ON solicitudes_repuestos(repuesto_id);

    CREATE TABLE IF NOT EXISTS servicio_catalogo(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(100) NOT NULL UNIQUE,
        descripcion text,
        precio_base numeric(10,2) NOT NULL DEFAULT 0 CHECK (precio_base >= 0)
    );

    CREATE TABLE IF NOT EXISTS orden_servicio(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
        servicio_id bigint NOT NULL REFERENCES servicio_catalogo(id),
        tiempo_empleado_minutos integer CHECK (tiempo_empleado_minutos >= 0),
        observaciones text,
        precio_aplicado numeric(10,2) NOT NULL CHECK (precio_aplicado >= 0),
        fecha_registro timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS orden_servicios_orden_idx ON orden_servicio(orden_id);

    -- Conservadas de tu esquema anterior. No estaban en el script nuevo,
    -- pero facturación y recuperación de contraseña dependen de ellas.
    CREATE TABLE IF NOT EXISTS facturas(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        numero_factura varchar(20) UNIQUE,
        orden_id bigint NOT NULL UNIQUE REFERENCES ordenes_trabajo(id),
        subtotal numeric(10,2) NOT NULL,
        impuestos numeric(10,2) NOT NULL DEFAULT 0,
        total numeric(10,2) NOT NULL,
        estado estado_factura NOT NULL DEFAULT 'pendiente',
        fecha_emision timestamptz NOT NULL DEFAULT now(),
        fecha_vencimiento date,
        fecha_pago timestamptz,
        metodo_pago metodo_pago,
        recordatorio_enviado boolean NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS pagos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        factura_id bigint NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
        monto numeric(10,2) NOT NULL,
        metodo_pago metodo_pago NOT NULL,
        fecha_pago timestamptz NOT NULL DEFAULT now(),
        registrado_por bigint REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS tokens_recuperacion(
        id SERIAL PRIMARY KEY,
        email varchar(150) NOT NULL,
        token varchar(255) NOT NULL,
        expires_at timestamptz NOT NULL,
        used boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
    );
  `;

  try {
    await pool.query(ddl);
    console.log("Tablas creadas correctamente.");

    // Sembramos los datos de prueba UNA sola vez: si ya hay roles,
    // asumimos que el resto también ya está sembrado y no insertamos
    // nada más. Esto evita duplicados en cada reinicio y evita errores
    // de llave duplicada que tumbarían el servidor completo.
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM roles');
    if (rows[0].total > 0) {
      console.log("Datos de prueba ya existentes, no se vuelven a sembrar.");
      return;
    }

    await pool.query(`
      INSERT INTO roles (nombre, descripcion) VALUES
      ('administrador', 'Acceso total al sistema'),
      ('mecanico', 'Encargado de diagnósticos y reparaciones'),
      ('recepcionista', 'Atención al cliente y registro de órdenes');
    `);

    // Usuario admin real, con contraseña utilizable (el script original
    // no traía ningún usuario "admin", solo empleados ficticios).
    const hashAdmin = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo)
      VALUES ('Administrador', 'admin', 'admin@taller.com', $1,
              (SELECT id FROM roles WHERE nombre = 'administrador'), true);
    `, [hashAdmin]);

    // Empleados de ejemplo. OJO: usan hashes de relleno ($2b$10$hash1...),
    // no contraseñas reales — nadie puede loguearse con estas cuentas
    // hasta que se les asigne un hash bcrypt válido de verdad.
    await pool.query(`
      INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo) VALUES
      ('Carlos Mendoza',   'cmendoza',  'cmendoza@tallerpiston.hn',  '$2b$10$hash1', 1, true),
      ('Ana Lopez',        'alopez',    'alopez@tallerpiston.hn',    '$2b$10$hash2', 3, true),
      ('Jose Martinez',    'jmartinez', 'jmartinez@tallerpiston.hn', '$2b$10$hash3', 2, true),
      ('Maria Rodriguez',  'mrodriguez','mrodriguez@tallerpiston.hn','$2b$10$hash4', 2, true),
      ('Luis Fernandez',   'lfernandez','lfernandez@tallerpiston.hn','$2b$10$hash5', 2, true),
      ('Karla Zelaya',     'kzelaya',   'kzelaya@tallerpiston.hn',   '$2b$10$hash6', 3, true),
      ('Roberto Paz',      'rpaz',      'rpaz@tallerpiston.hn',      '$2b$10$hash7', 2, true),
      ('Sofia Cruz',       'scruz',     'scruz@tallerpiston.hn',     '$2b$10$hash8', 1, true),
      ('Diego Amaya',      'damaya',    'damaya@tallerpiston.hn',    '$2b$10$hash9', 2, false),
      ('Elena Suazo',      'esuazo',    'esuazo@tallerpiston.hn',    '$2b$10$hash10',3, true);
    `);

    await pool.query(`
      INSERT INTO modulos (nombre, descripcion) VALUES
      ('usuarios',        'Gestión de usuarios del sistema'),
      ('roles',           'Gestión de roles y permisos'),
      ('clientes',        'Gestión de clientes'),
      ('vehiculos',       'Gestión de vehículos registrados'),
      ('ordenes_trabajo', 'Gestión de órdenes de trabajo'),
      ('diagnosticos',    'Gestión de diagnósticos técnicos'),
      ('inventario',      'Gestión de inventario de repuestos'),
      ('servicios',       'Catálogo de servicios ofrecidos'),
      ('facturacion',     'Gestión de facturación'),
      ('reportes',        'Reportes y estadísticas del taller');
    `);

    await pool.query(`
      INSERT INTO permisos_rol (rol_id, modulo_id, puede_ver, puede_editar, puede_eliminar) VALUES
      (1, 1,  true, true,  true),
      (1, 2,  true, true,  true),
      (1, 3,  true, true,  true),
      (1, 4,  true, true,  true),
      (1, 5,  true, true,  true),
      (1, 6,  true, true,  true),
      (1, 7,  true, true,  true),
      (1, 8,  true, true,  true),
      (1, 9,  true, true,  true),
      (1, 10, true, true,  true);
    `);

    await pool.query(`
      INSERT INTO direcciones (calle, colonia, ciudad, departamento, referencia) VALUES
      ('Bo. El Centro, 2da Ave',    'El Centro',       'Choluteca',    'Choluteca',     'Frente al parque central'),
      ('Col. Kennedy, Calle Principal', 'Kennedy',     'Tegucigalpa',  'Francisco Morazán', 'Cerca de la iglesia católica'),
      ('Barrio Guamilito',          'Guamilito',       'San Pedro Sula','Cortés',       'Contiguo al mercado'),
      ('Col. Rio de Piedras',       'Rio de Piedras',  'La Ceiba',     'Atlántida',     'Cerca del puente'),
      ('Bo. Suyapa',                'Suyapa',          'Tegucigalpa',  'Francisco Morazán', 'A media cuadra de la basílica'),
      ('Col. Trejo',                'Trejo',           'Choluteca',    'Choluteca',     'Frente a la gasolinera'),
      ('Res. Villa Olímpica',       'Villa Olímpica',  'San Pedro Sula','Cortés',       'Cerca del estadio'),
      ('Bo. La Bolsa',              'La Bolsa',        'Danlí',        'El Paraíso',    'Contiguo a la alcaldía'),
      ('Col. Las Palmas',           'Las Palmas',      'La Ceiba',     'Atlántida',     'Cerca del malecón'),
      ('Bo. El Manchén',            'El Manchén',      'Tegucigalpa',  'Francisco Morazán', 'Frente al parque Concordia');
    `);

    await pool.query(`
      INSERT INTO clientes (dni, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo, direccion_id) VALUES
      ('0501199012345', 'Pedro',    NULL,       'Hernandez', 'Reyes',    '9988-1122', 'phernandez@gmail.com', 1),
      ('0801198854321', 'Lucia',    'Fernanda', 'Gomez',     'Castillo', '9977-2233', 'lgomez@gmail.com',     2),
      ('0401199523456', 'Manuel',   NULL,       'Zuniga',    'Ordonez',  '9966-3344', 'mzuniga@gmail.com',    3),
      ('0301198745678', 'Andrea',   'Beatriz',  'Molina',    'Aguilar',  '9955-4455', 'amolina@gmail.com',    4),
      ('0501200198765', 'Fernando', NULL,       'Rivera',    'Castro',   '9944-5566', 'frivera@gmail.com',    5),
      ('0801199234567', 'Gabriela', 'Isabel',   'Torres',    'Mejia',    '9933-6677', 'gtorres@gmail.com',    6),
      ('0601199876543', 'Ricardo',  NULL,       'Pineda',    'Lopez',    '9922-7788', 'rpineda@gmail.com',    7),
      ('0501198632109', 'Daniela',  'Sofia',    'Banegas',   'Nunez',    '9911-8899', 'dbanegas@gmail.com',   8),
      ('0401200187654', 'Oscar',    NULL,       'Chavez',    'Rodas',    '9900-9911', 'ochavez@gmail.com',    9),
      ('0801199945678', 'Patricia', 'Elena',    'Sabillon',  'Diaz',     '9888-0022', 'psabillon@gmail.com',  10);
    `);

    await pool.query(`
      INSERT INTO auditoria_clientes (cliente_id, campo_modificado, valor_anterior, valor_nuevo) VALUES
      (1, 'telefono', '9988-0000', '9988-1122'),
      (2, 'correo',   'lgomez@hotmail.com', 'lgomez@gmail.com'),
      (3, 'direccion_id', '5', '3'),
      (4, 'telefono', '9955-0000', '9955-4455'),
      (5, 'correo',   'frivera@hotmail.com', 'frivera@gmail.com'),
      (6, 'telefono', '9933-0000', '9933-6677'),
      (7, 'direccion_id', '2', '7'),
      (8, 'correo',   'dbanegas@hotmail.com', 'dbanegas@gmail.com'),
      (9, 'telefono', '9900-0000', '9900-9911'),
      (10,'correo',   'psabillon@hotmail.com','psabillon@gmail.com');
    `);

    await pool.query(`
      INSERT INTO marcas_vehiculo (nombre) VALUES
      ('Toyota'), ('Nissan'), ('Honda'), ('Mazda'), ('Hyundai'),
      ('Kia'), ('Chevrolet'), ('Ford'), ('Mitsubishi'), ('Suzuki');
    `);

    await pool.query(`
      INSERT INTO vehiculos (placa, marca_id, modelo, anio, color, tipo, cliente_id) VALUES
      ('PBH1234', 1, 'Hilux',      2020, 'Blanco',  'Pickup',    1),
      ('PBH5678', 2, 'Sentra',     2018, 'Gris',    'turismo',   2),
      ('PBH9012', 3, 'Civic',      2021, 'Negro',   'turismo',   3),
      ('PBH3456', 4, 'CX-5',       2019, 'Rojo',    'camioneta', 4),
      ('PBH7890', 5, 'Tucson',     2022, 'Azul',    'camioneta', 5),
      ('PBH2468', 6, 'Sportage',   2017, 'Blanco',  'camioneta', 6),
      ('PBH1357', 7, 'Silverado',  2020, 'Negro',   'Pickup',    7),
      ('PBH9753', 8, 'Ranger',     2023, 'Gris',    'Pickup',    8),
      ('PBH8642', 9, 'L200',       2016, 'Plateado','Pickup',    9),
      ('PBH1122', 10,'Grand Vitara',2019,'Verde',   'camioneta', 10);
    `);

    await pool.query(`
      INSERT INTO ordenes_trabajo (numero_orden, vehiculo_id, mecanico_id, fecha_ingreso, descripcion_problema, estado, prioridad) VALUES
      ('ORD-0001', 1,  3, '2026-06-01', 'Ruido en el motor al acelerar', 'entregado',    1),
      ('ORD-0002', 2,  4, '2026-06-03', 'Fallo en el sistema de frenos', 'listo',        2),
      ('ORD-0003', 3,  5, '2026-06-05', 'No enciende el vehículo',        'en reparacion',3),
      ('ORD-0004', 4,  7, '2026-06-07', 'Cambio de aceite y filtros',     'recibido',     0),
      ('ORD-0005', 5,  3, '2026-06-08', 'Aire acondicionado no enfría',   'en reparacion',1),
      ('ORD-0006', 6,  4, '2026-06-10', 'Revisión de suspensión',         'recibido',     1),
      ('ORD-0007', 7,  5, '2026-06-11', 'Fuga de aceite en el motor',     'listo',        2),
      ('ORD-0008', 8,  7, '2026-06-12', 'Cambio de banda de distribución','en reparacion',3),
      ('ORD-0009', 9,  3, '2026-06-13', 'Revisión eléctrica general',     'entregado',    1),
      ('ORD-0010', 10, 4, '2026-06-14', 'Alineación y balanceo',          'recibido',     0);
    `);

    await pool.query(`
      INSERT INTO historial_estados_orden (orden_id, estado, notas, usuario_id) VALUES
      (1, 'recibido',      'Ingreso del vehículo al taller', 2),
      (1, 'entregado',     'Vehículo entregado al cliente',  2),
      (2, 'recibido',      'Ingreso del vehículo al taller', 2),
      (2, 'listo',         'Reparación finalizada',          4),
      (3, 'en reparacion', 'Diagnóstico eléctrico en curso',  5),
      (4, 'recibido',      'Ingreso para mantenimiento',      6),
      (5, 'en reparacion', 'Revisando compresor de A/C',      3),
      (6, 'recibido',      'Ingreso del vehículo al taller',  6),
      (7, 'listo',         'Fuga reparada',                   5),
      (8, 'en reparacion', 'Cambiando banda de distribución', 7);
    `);

    await pool.query(`
      INSERT INTO diagnosticos (orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id) VALUES
      (1, 'Desgaste en soportes de motor',       'Ruido más notorio en frío',       'Reemplazar soportes',            'completado', 3),
      (2, 'Pastillas de freno desgastadas',      'Espesor menor al mínimo',         'Cambiar pastillas y discos',      'completado', 4),
      (3, 'Falla en batería y alternador',       'Batería con baja carga',          'Reemplazar batería',              'en proceso', 5),
      (4, 'Aceite y filtros vencidos',           'Aceite con sedimentos',           'Cambio de aceite sintético',       'pendiente',  7),
      (5, 'Compresor de A/C dañado',             'Sin presión de gas refrigerante', 'Reemplazar compresor',            'en proceso', 3),
      (6, 'Amortiguadores desgastados',          'Rebote excesivo en baches',       'Cambiar amortiguadores',           'pendiente',  4),
      (7, 'Fuga por empaque de cárter',          'Manchas de aceite bajo el motor', 'Cambiar empaque',                 'completado', 5),
      (8, 'Banda de distribución agrietada',     'Riesgo de rotura inminente',      'Reemplazo inmediato',             'en proceso', 7),
      (9, 'Corto circuito en panel de luces',    'Fusible quemado repetidamente',   'Revisar cableado completo',        'completado', 3),
      (10,'Desalineación en eje delantero',      'Desgaste irregular de llantas',   'Alinear y balancear',             'pendiente',  4);
    `);

    await pool.query(`
      INSERT INTO categorias_repuestos (nombre) VALUES
      ('Frenos'), ('Motor'), ('Suspensión'), ('Eléctrico'), ('Transmisión'),
      ('Refrigeración'), ('Filtros'), ('Neumáticos'), ('Carrocería'), ('Aceites y Lubricantes');
    `);

    await pool.query(`
      INSERT INTO repuestos (codigo, nombre, categoria_id, precio_unitario) VALUES
      ('REP-001', 'Pastillas de freno delanteras', 1, 850.00),
      ('REP-002', 'Disco de freno',                1, 1200.00),
      ('REP-003', 'Soporte de motor',              2, 650.00),
      ('REP-004', 'Batería 12V',                   4, 2500.00),
      ('REP-005', 'Filtro de aceite',              7, 180.00),
      ('REP-006', 'Filtro de aire',                7, 220.00),
      ('REP-007', 'Amortiguador delantero',        3, 1450.00),
      ('REP-008', 'Compresor de A/C',              4, 4200.00),
      ('REP-009', 'Banda de distribución',         5, 980.00),
      ('REP-010', 'Aceite sintético 5W-30 (galón)',10, 750.00);
    `);

    await pool.query(`
      INSERT INTO stock_repuestos (repuesto_id, cantidad_disponible, cantidad_minima) VALUES
      (1, 25, 5), (2, 18, 4), (3, 12, 3), (4, 8, 2), (5, 40, 10),
      (6, 35, 10), (7, 15, 3), (8, 5, 2), (9, 10, 3), (10, 22, 5);
    `);

    await pool.query(`
      INSERT INTO movimientos_inventario (repuesto_id, tipo_movimiento, cantidad, motivo, orden_id, usuario_id) VALUES
      (1, 'salida',  2, 'Uso en orden de trabajo',     2, 4),
      (2, 'salida',  2, 'Uso en orden de trabajo',     2, 4),
      (3, 'salida',  2, 'Uso en orden de trabajo',     1, 3),
      (4, 'salida',  1, 'Uso en orden de trabajo',     3, 5),
      (5, 'salida',  1, 'Uso en orden de trabajo',     4, 7),
      (6, 'salida',  1, 'Uso en orden de trabajo',     4, 7),
      (8, 'salida',  1, 'Uso en orden de trabajo',     5, 3),
      (9, 'salida',  1, 'Uso en orden de trabajo',     8, 7),
      (10,'entrada', 20,'Compra a proveedor',          NULL, 8),
      (1, 'entrada', 15,'Compra a proveedor',          NULL, 8);
    `);

    await pool.query(`
      INSERT INTO solicitudes_repuestos (orden_id, repuesto_id, cantidad_solicitada, precio_historico, mecanico_id) VALUES
      (1, 3,  2, 650.00,  3),
      (2, 1,  2, 850.00,  4),
      (2, 2,  2, 1200.00, 4),
      (3, 4,  1, 2500.00, 5),
      (4, 5,  1, 180.00,  7),
      (4, 6,  1, 220.00,  7),
      (4, 10, 4, 750.00,  7),
      (5, 8,  1, 4200.00, 3),
      (7, 3,  1, 650.00,  5),
      (8, 9,  1, 980.00,  7);
    `);

    await pool.query(`
      INSERT INTO servicio_catalogo (nombre, descripcion, precio_base) VALUES
      ('Cambio de aceite',              'Cambio de aceite y filtro',                       450.00),
      ('Alineación',                    'Alineación de las 4 ruedas',                      500.00),
      ('Balanceo',                      'Balanceo de neumáticos',                          350.00),
      ('Servicio de frenos',            'Revisión y cambio de pastillas/discos',           900.00),
      ('Afinación de motor',            'Revisión general del motor',                      1500.00),
      ('Diagnóstico computarizado',     'Escaneo electrónico del vehículo',                600.00),
      ('Cambio de banda de distribución','Reemplazo de banda y revisión de tensores',      1800.00),
      ('Reparación de motor',           'Reparación mayor de componentes internos',        5000.00),
      ('Cambio de llantas',             'Montaje y desmontaje de neumáticos',              300.00),
      ('Revisión eléctrica',            'Diagnóstico del sistema eléctrico completo',      700.00);
    `);

    await pool.query(`
      INSERT INTO orden_servicio (orden_id, servicio_id, tiempo_empleado_minutos, observaciones, precio_aplicado) VALUES
      (1, 5,  120, 'Afinación completa por ruido de motor',        1500.00),
      (2, 4,  90,  'Cambio de pastillas y discos delanteros',      900.00),
      (3, 6,  45,  'Escaneo para verificar falla eléctrica',       600.00),
      (4, 1,  30,  'Cambio de aceite de rutina',                   450.00),
      (5, 10, 60,  'Revisión de sistema de A/C',                   700.00),
      (6, 2,  40,  'Alineación por desgaste irregular',            500.00),
      (7, 8,  180, 'Reparación de fuga en cárter',                 5000.00),
      (8, 7,  150, 'Reemplazo urgente de banda de distribución',   1800.00),
      (9, 10, 50,  'Revisión eléctrica del panel de luces',        700.00),
      (10,3,  30,  'Balanceo tras alineación',                     350.00);
    `);

    console.log("Datos de prueba sembrados correctamente.");

  } catch (err) {
    console.error("Error completo al sincronizar base de datos:", err);
    throw err;
  }
};

module.exports = setupDatabase;