const pool = require('./db');
const bcrypt = require('bcryptjs');

const setupDatabase = async () => {
  const sql = `
    /* Tipos enumerados */
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

    /* TABLAS */
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
        id SERIAL PRIMARY KEY,
        calle varchar(255) NOT NULL,
        colonia varchar(255) NOT NULL,
        ciudad varchar(100) NOT NULL,
        departamento varchar(100) NOT NULL,
        referencia text
    );

    CREATE TABLE IF NOT EXISTS clientes(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(150) NOT NULL,
        telefono varchar(150) NOT NULL,
        correo varchar(150),
        direccion varchar(255),  /* Volvemos a la columna original que busca tu modelo */
        fecha_registro timestamptz NOT NULL DEFAULT now(),
        editado_por bigint REFERENCES usuarios(id),
        fecha_edicion timestamptz
    );

    CREATE TABLE IF NOT EXISTS vehiculos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        placa varchar(15) NOT NULL UNIQUE,
        marca varchar(50) NOT NULL,
        modelo varchar(50) NOT NULL,
        anio smallint NOT NULL,
        color varchar(30),
        tipo tipo_vehiculo NOT NULL,
        cliente_id bigint NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
        fecha_registro timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ordenes_trabajo(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        numero_orden varchar(20) UNIQUE,
        cliente_id bigint NOT NULL REFERENCES clientes(id),
        vehiculo_id bigint NOT NULL REFERENCES vehiculos(id),
        mecanico_id bigint REFERENCES usuarios(id),
        fecha_ingreso date NOT NULL DEFAULT current_date,
        descripcion_problema text NOT NULL,
        estado estado_orden NOT NULL DEFAULT 'recibido',
        prioridad smallint NOT NULL DEFAULT 0,
        fecha_creacion timestamptz NOT NULL DEFAULT now(),
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS historial_estados_orden(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
        estado estado_orden NOT NULL,
        notas text,
        usuario_id bigint REFERENCES usuarios(id),
        fecha_hora timestamptz NOT NULL DEFAULT now()
    );

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

    CREATE TABLE IF NOT EXISTS categorias_repuestos(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(50) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS repuestos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        codigo varchar(30) NOT NULL UNIQUE,
        nombre varchar(150) NOT NULL,
        categoria_id smallint REFERENCES categorias_repuestos(id),
        cantidad_disponible integer NOT NULL DEFAULT 0,
        cantidad_minima integer NOT NULL DEFAULT 0,
        precio_unitario numeric(10,2) NOT NULL,
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS solicitudes_repuestos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
        repuestos_id bigint NOT NULL REFERENCES repuestos(id),
        cantidad_solicitada integer NOT NULL,
        precio_unitario numeric(10,2) NOT NULL,
        mecanico_id bigint REFERENCES usuarios(id),
        fecha_solicitud timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS servicio_catalogo(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(100) NOT NULL UNIQUE,
        descripcion text,
        precio_base numeric(10,2) NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orden_servicio(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
        servicio_id bigint NOT NULL REFERENCES servicio_catalogo(id),
        tiempo_empleado_minutos integer,
        observaciones text,
        precio_aplicado numeric(10,2) NOT NULL,
        fecha_registro timestamptz NOT NULL DEFAULT now()
    );

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
    await pool.query(sql);
    console.log("Tablas creadas correctamente.");

    await pool.query(`
      INSERT INTO roles (nombre, descripcion) 
      VALUES ('administrador', 'Acceso total al sistema') 
      ON CONFLICT (nombre) DO NOTHING;
    `);

    const hash = await bcrypt.hash('admin', 10);

    await pool.query(`
      INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo)
      VALUES (
        'Administrador',
        'admin',
        'admin@taller.com',
        $1,
        (SELECT id FROM roles WHERE nombre = 'administrador'),
        true
      )
      ON CONFLICT (nombre_usuario) DO NOTHING;
    `, [hash]);

    console.log("Usuario administrador inicializado.");


    await pool.query(`
      CREATE TABLE IF NOT EXISTS marcas_vehiculo(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(50) NOT NULL UNIQUE
      );
    `);

    await pool.query(`
      INSERT INTO marcas_vehiculo (nombre) VALUES
        ('Toyota'), ('Honda'), ('Nissan'), ('Chevrolet'), ('Ford'),
        ('Hyundai'), ('Kia'), ('Mazda'), ('Mitsubishi'), ('Suzuki'),
        ('Volkswagen'), ('BMW'), ('Mercedes-Benz'), ('Jeep'), ('Dodge')
      ON CONFLICT (nombre) DO NOTHING;
    `);

    console.log("Marcas de vehículos inicializadas.");

  } catch (err) {
    console.error("Error al sincronizar base de datos:", err.message);
  }
};

module.exports = setupDatabase;