const pool = require('./db');
const bcrypt = require('bcryptjs');

const setupDatabase = async () => {
  const ddl = `
    -- ---------------------------------------------------------
    -- TIPOS ENUMERADOS (guardados con DO$$ para no fallar si ya existen)
    -- ---------------------------------------------------------
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
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_pago') THEN
            CREATE TYPE metodo_pago AS ENUM ('efectivo','tarjeta','transferencia');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_detalle_factura') THEN
            CREATE TYPE tipo_detalle_factura AS ENUM ('servicio','repuesto');
        END IF;
    END $$;

    -- ---------------------------------------------------------
    -- USUARIOS, ROLES Y PERMISOS
    -- ---------------------------------------------------------
    CREATE TABLE IF NOT EXISTS roles(
        id  smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre  rol_nombre NOT NULL UNIQUE,
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

    CREATE TABLE IF NOT EXISTS tokens_recuperacion_password(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        usuario_id bigint NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        token_hash varchar(255) NOT NULL UNIQUE,
        fecha_expiracion timestamptz NOT NULL,
        usado boolean NOT NULL DEFAULT false,
        fecha_creacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS tokens_recuperacion_usuario_idx ON tokens_recuperacion_password(usuario_id);

    CREATE TABLE IF NOT EXISTS modulos(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(50) NOT NULL UNIQUE,
        descripcion varchar(150)
    );

    CREATE TABLE IF NOT EXISTS permisos_rol(
        rol_id  smallint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        modulo_id smallint NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
        puede_ver boolean NOT NULL DEFAULT false,
        puede_editar    boolean NOT NULL DEFAULT false,
        puede_eliminar  boolean NOT NULL DEFAULT false,
        PRIMARY KEY (rol_id, modulo_id)
    );

    -- ---------------------------------------------------------
    -- CLIENTES Y VEHICULOS
    -- ---------------------------------------------------------
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

    -- ---------------------------------------------------------
    -- ORDENES DE TRABAJO E HISTORIAL DE ESTADOS
    -- ---------------------------------------------------------
    CREATE SEQUENCE IF NOT EXISTS ordenes_trabajo_numero_seq;

    CREATE TABLE IF NOT EXISTS ordenes_trabajo(
        numero_orden varchar(20) PRIMARY KEY
            DEFAULT ('ORD-' || nextval('ordenes_trabajo_numero_seq')),
        vehiculo_id bigint NOT NULL REFERENCES vehiculos(id),
        mecanico_id bigint REFERENCES usuarios(id),
        fecha_ingreso date NOT NULL DEFAULT current_date,
        descripcion_problema text NOT NULL,
        estado estado_orden NOT NULL DEFAULT 'recibido',
        prioridad smallint NOT NULL DEFAULT 0,
        fecha_creacion timestamptz NOT NULL DEFAULT now(),
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    ALTER SEQUENCE ordenes_trabajo_numero_seq OWNED BY ordenes_trabajo.numero_orden;

    CREATE INDEX IF NOT EXISTS ordenes_estado_idx ON ordenes_trabajo(estado);
    CREATE INDEX IF NOT EXISTS ordenes_mecanico_idx ON ordenes_trabajo(mecanico_id);
    CREATE INDEX IF NOT EXISTS ordenes_vehiculo_idx ON ordenes_trabajo(vehiculo_id);
    CREATE INDEX IF NOT EXISTS ordenes_fecha_idx ON ordenes_trabajo(fecha_ingreso);

    CREATE TABLE IF NOT EXISTS historial_estados_orden(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id varchar(20) NOT NULL REFERENCES ordenes_trabajo(numero_orden) ON DELETE CASCADE,
        estado estado_orden NOT NULL,
        notas text,
        usuario_id bigint REFERENCES usuarios(id),
        fecha_hora timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS historial_orden_idx ON historial_estados_orden(orden_id);

    -- ---------------------------------------------------------
    -- DIAGNOSTICOS TECNICOS
    -- ---------------------------------------------------------
    CREATE TABLE IF NOT EXISTS diagnosticos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id varchar(20) NOT NULL REFERENCES ordenes_trabajo(numero_orden),
        descripcion_falla text NOT NULL,
        observaciones text,
        recomendaciones text,
        estado estado_diagnostico NOT NULL DEFAULT 'pendiente',
        mecanico_id bigint REFERENCES usuarios(id),
        fecha_registro timestamptz NOT NULL DEFAULT now(),
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS diagnosticos_orden_idx ON diagnosticos(orden_id);

    CREATE TABLE IF NOT EXISTS evidencias_diagnostico(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        diagnostico_id bigint NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
        usuario_id bigint NOT NULL REFERENCES usuarios(id),
        nombre_archivo varchar(255) NOT NULL,
        ruta_archivo text NOT NULL,
        tipo_archivo varchar(10) NOT NULL CHECK (tipo_archivo IN ('jpg','jpeg','png','webp')),
        tamano_bytes integer NOT NULL CHECK (tamano_bytes > 0 AND tamano_bytes <= 5242880),
        fecha_subida timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS evidencias_diagnostico_idx ON evidencias_diagnostico(diagnostico_id);
    CREATE INDEX IF NOT EXISTS evidencias_usuario_idx ON evidencias_diagnostico(usuario_id);

    -- ---------------------------------------------------------
    -- INVENTARIO DE REPUESTOS
    -- ---------------------------------------------------------
    CREATE TABLE IF NOT EXISTS categorias_repuestos(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        nombre varchar(50) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS repuestos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        codigo varchar(30) NOT NULL UNIQUE,
        nombre varchar(150) NOT NULL,
        categoria_id smallint REFERENCES categorias_repuestos(id),
        costo_unitario numeric(10,2) NOT NULL CHECK (costo_unitario >= 0),
        precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
        fecha_creacion timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT precio_mayor_o_igual_costo CHECK (precio_unitario >= costo_unitario)
    );

    CREATE INDEX IF NOT EXISTS repuestos_categoria_idx ON repuestos(categoria_id);

    CREATE TABLE IF NOT EXISTS stock_repuestos(
        repuesto_id bigint PRIMARY KEY REFERENCES repuestos(id) ON DELETE CASCADE,
        cantidad_disponible integer NOT NULL DEFAULT 0 CHECK (cantidad_disponible >=0),
        cantidad_minima integer NOT NULL DEFAULT 0 CHECK (cantidad_minima >=0),
        fecha_actualizacion timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS movimientos_inventario(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        repuesto_id bigint NOT NULL REFERENCES repuestos(id),
        tipo_movimiento varchar(10) NOT NULL CHECK (tipo_movimiento IN ('entrada','salida')),
        cantidad integer NOT NULL CHECK (cantidad > 0),
        motivo varchar(100),
        orden_id varchar(20) REFERENCES ordenes_trabajo(numero_orden),
        usuario_id bigint REFERENCES usuarios(id),
        fecha_hora timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS mov_inventario_repuesto_idx ON movimientos_inventario(repuesto_id);
    CREATE INDEX IF NOT EXISTS mov_inventario_orden_idx ON movimientos_inventario(orden_id);

    CREATE TABLE IF NOT EXISTS solicitudes_repuestos(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id varchar(20) NOT NULL REFERENCES ordenes_trabajo(numero_orden) ON DELETE CASCADE,
        repuesto_id bigint NOT NULL REFERENCES repuestos(id),
        cantidad_solicitada integer NOT NULL CHECK (cantidad_solicitada > 0),
        costo_historico numeric(10,2) NOT NULL,
        precio_historico numeric(10,2) NOT NULL,
        mecanico_id bigint REFERENCES usuarios(id),
        fecha_solicitud timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS solicitudes_orden_idx ON solicitudes_repuestos(orden_id);
    CREATE INDEX IF NOT EXISTS solicitudes_repuesto_idx ON solicitudes_repuestos(repuesto_id);

    -- ---------------------------------------------------------
    -- SERVICIOS REALIZADOS
    -- ---------------------------------------------------------
    CREATE TABLE IF NOT EXISTS servicio_catalogo(
        id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        nombre varchar(100) NOT NULL UNIQUE,
        descripcion text,
        precio_base numeric(10,2) NOT NULL DEFAULT 0 CHECK (precio_base >= 0)
    );

    CREATE TABLE IF NOT EXISTS orden_servicio(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id varchar(20) NOT NULL REFERENCES ordenes_trabajo(numero_orden) ON DELETE CASCADE,
        servicio_id bigint NOT NULL REFERENCES servicio_catalogo(id),
        tiempo_empleado_minutos integer CHECK (tiempo_empleado_minutos >= 0),
        observaciones text,
        precio_aplicado numeric(10,2) NOT NULL CHECK (precio_aplicado >= 0),
        fecha_registro timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS orden_servicios_orden_idx ON orden_servicio(orden_id);

    -- ---------------------------------------------------------
    -- FACTURACION (CAI / SAR Honduras)
    -- ---------------------------------------------------------
    CREATE TABLE IF NOT EXISTS autorizaciones_cai(
        id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        cai varchar(44) NOT NULL UNIQUE
            CHECK (cai ~ '^[0-9A-Z]{6}(-[0-9A-Z]{6}){5}-[0-9A-Z]{2}$'),
        punto_emision varchar(11) NOT NULL
            CHECK (punto_emision ~ '^[0-9]{3}-[0-9]{3}-[0-9]{2}$'),
        rango_autorizado_inicio varchar(19) NOT NULL
            CHECK (rango_autorizado_inicio ~ '^[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8}$'),
        rango_autorizado_fin varchar(19) NOT NULL
            CHECK (rango_autorizado_fin ~ '^[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8}$'),
        fecha_limite_emision date NOT NULL,
        fecha_autorizacion date NOT NULL DEFAULT current_date,
        activo boolean NOT NULL DEFAULT true,
        CHECK (rango_autorizado_fin > rango_autorizado_inicio)
    );

    CREATE TABLE IF NOT EXISTS facturas(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        orden_id varchar(20) NOT NULL UNIQUE REFERENCES ordenes_trabajo(numero_orden),
        cai_id smallint NOT NULL REFERENCES autorizaciones_cai(id),
        numero_factura varchar(19) NOT NULL UNIQUE
            CHECK (numero_factura ~ '^[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8}$'),
        cliente_dni varchar(13) NOT NULL,
        cliente_nombre varchar(300) NOT NULL,
        cliente_direccion text,
        metodo_pago metodo_pago,
        subtotal_exento numeric(10,2) NOT NULL DEFAULT 0 CHECK (subtotal_exento >= 0),
        subtotal_gravado_15 numeric(10,2) NOT NULL DEFAULT 0 CHECK (subtotal_gravado_15 >= 0),
        isv_15 numeric(10,2) GENERATED ALWAYS AS (round(subtotal_gravado_15 * 0.15, 2)) STORED,
        total numeric(10,2) GENERATED ALWAYS AS
            (subtotal_exento + subtotal_gravado_15 + round(subtotal_gravado_15 * 0.15, 2)) STORED,
        fecha_emision timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS facturas_orden_idx ON facturas(orden_id);
    CREATE INDEX IF NOT EXISTS facturas_cai_idx ON facturas(cai_id);

    CREATE OR REPLACE FUNCTION fn_validar_factura_cai() RETURNS trigger AS $$
    DECLARE
        v_cai autorizaciones_cai%ROWTYPE;
    BEGIN
        SELECT * INTO v_cai FROM autorizaciones_cai WHERE id = NEW.cai_id;

        IF NOT v_cai.activo THEN
            RAISE EXCEPTION 'El CAI % ya no esta activo', v_cai.cai;
        END IF;

        IF NEW.numero_factura < v_cai.rango_autorizado_inicio
            OR NEW.numero_factura > v_cai.rango_autorizado_fin THEN
            RAISE EXCEPTION 'El numero de factura % esta fuera del rango autorizado (% - %) del CAI %',
                NEW.numero_factura, v_cai.rango_autorizado_inicio, v_cai.rango_autorizado_fin, v_cai.cai;
        END IF;

        IF date(NEW.fecha_emision) > v_cai.fecha_limite_emision THEN
            RAISE EXCEPTION 'La fecha de emision % supera la fecha limite de emision (%) autorizada por el CAI',
                date(NEW.fecha_emision), v_cai.fecha_limite_emision;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_validar_factura_cai ON facturas;
    CREATE TRIGGER trg_validar_factura_cai
    BEFORE INSERT OR UPDATE ON facturas
    FOR EACH ROW EXECUTE FUNCTION fn_validar_factura_cai();

    CREATE TABLE IF NOT EXISTS factura_detalle(
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        factura_id bigint NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
        tipo tipo_detalle_factura NOT NULL,
        orden_servicio_id bigint REFERENCES orden_servicio(id),
        solicitud_repuesto_id bigint REFERENCES solicitudes_repuestos(id),
        descripcion varchar(200) NOT NULL,
        cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
        costo_unitario numeric(10,2) NOT NULL CHECK (costo_unitario >= 0),
        monto_gravado numeric(10,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
        CONSTRAINT factura_detalle_origen_valido CHECK (
            (tipo = 'servicio' AND orden_servicio_id IS NOT NULL AND solicitud_repuesto_id IS NULL)
            OR
            (tipo = 'repuesto' AND solicitud_repuesto_id IS NOT NULL AND orden_servicio_id IS NULL)
        )
    );

    CREATE INDEX IF NOT EXISTS factura_detalle_factura_idx ON factura_detalle(factura_id);
    CREATE INDEX IF NOT EXISTS factura_detalle_orden_servicio_idx ON factura_detalle(orden_servicio_id);
    CREATE INDEX IF NOT EXISTS factura_detalle_solicitud_repuesto_idx ON factura_detalle(solicitud_repuesto_id);

    CREATE OR REPLACE FUNCTION fn_recalcular_subtotal_factura() RETURNS trigger AS $$
    DECLARE
        v_factura_id bigint;
    BEGIN
        v_factura_id := COALESCE(NEW.factura_id, OLD.factura_id);

        UPDATE facturas
        SET subtotal_gravado_15 = COALESCE(
            (SELECT SUM(monto_gravado) FROM factura_detalle WHERE factura_id = v_factura_id), 0)
        WHERE id = v_factura_id;

        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_recalcular_subtotal_factura ON factura_detalle;
    CREATE TRIGGER trg_recalcular_subtotal_factura
    AFTER INSERT OR UPDATE OR DELETE ON factura_detalle
    FOR EACH ROW EXECUTE FUNCTION fn_recalcular_subtotal_factura();

    CREATE OR REPLACE FUNCTION fn_generar_factura_al_entregar() RETURNS trigger AS $$
    DECLARE
        v_cai autorizaciones_cai%ROWTYPE;
        v_ultimo_numero varchar(19);
        v_nuevo_numero varchar(19);
        v_correlativo bigint;
        v_cliente clientes%ROWTYPE;
        v_cliente_nombre varchar(300);
        v_cliente_direccion text;
        v_factura_id bigint;
    BEGIN
        IF NEW.estado <> 'entregado' OR OLD.estado = 'entregado' THEN
            RETURN NEW;
        END IF;

        IF EXISTS (SELECT 1 FROM facturas WHERE orden_id = NEW.numero_orden) THEN
            RETURN NEW;
        END IF;

        SELECT * INTO v_cai
        FROM autorizaciones_cai
        WHERE activo = true AND fecha_limite_emision >= current_date
        ORDER BY id DESC
        LIMIT 1;

        IF v_cai.id IS NULL THEN
            RAISE EXCEPTION 'No hay un CAI activo y vigente para facturar la orden %', NEW.numero_orden;
        END IF;

        SELECT numero_factura INTO v_ultimo_numero
        FROM facturas
        WHERE cai_id = v_cai.id
        ORDER BY numero_factura DESC
        LIMIT 1;

        IF v_ultimo_numero IS NULL THEN
            v_nuevo_numero := v_cai.rango_autorizado_inicio;
        ELSE
            v_correlativo := substring(v_ultimo_numero FROM 12)::bigint + 1;
            v_nuevo_numero := left(v_ultimo_numero, 11) || lpad(v_correlativo::text, 8, '0');
        END IF;

        IF v_nuevo_numero > v_cai.rango_autorizado_fin THEN
            RAISE EXCEPTION 'El CAI % se quedo sin folios disponibles (rango agotado)', v_cai.cai;
        END IF;

        SELECT c.* INTO v_cliente
        FROM clientes c
        JOIN vehiculos veh ON veh.cliente_id = c.id
        WHERE veh.id = NEW.vehiculo_id;

        v_cliente_nombre := trim(
            v_cliente.primer_nombre || ' ' || COALESCE(v_cliente.segundo_nombre || ' ', '')
            || v_cliente.primer_apellido || ' ' || v_cliente.segundo_apellido
        );

        SELECT concat_ws(', ', d.calle, d.colonia, d.ciudad, d.departamento) INTO v_cliente_direccion
        FROM direcciones d
        WHERE d.id = v_cliente.direccion_id;

        INSERT INTO facturas
            (orden_id, cai_id, numero_factura, cliente_dni, cliente_nombre, cliente_direccion, subtotal_exento, subtotal_gravado_15)
        VALUES
            (NEW.numero_orden, v_cai.id, v_nuevo_numero, v_cliente.dni, v_cliente_nombre, v_cliente_direccion, 0, 0)
        RETURNING id INTO v_factura_id;

        INSERT INTO factura_detalle (factura_id, tipo, orden_servicio_id, descripcion, cantidad, costo_unitario)
        SELECT v_factura_id, 'servicio', os.id,
            sc.nombre || COALESCE(': ' || os.observaciones, ''),
            1, os.precio_aplicado
        FROM orden_servicio os
        JOIN servicio_catalogo sc ON sc.id = os.servicio_id
        WHERE os.orden_id = NEW.numero_orden;

        INSERT INTO factura_detalle (factura_id, tipo, solicitud_repuesto_id, descripcion, cantidad, costo_unitario)
        SELECT v_factura_id, 'repuesto', sr.id, rp.nombre, sr.cantidad_solicitada, sr.precio_historico
        FROM solicitudes_repuestos sr
        JOIN repuestos rp ON rp.id = sr.repuesto_id
        WHERE sr.orden_id = NEW.numero_orden;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_generar_factura_al_entregar ON ordenes_trabajo;
    CREATE TRIGGER trg_generar_factura_al_entregar
    AFTER UPDATE ON ordenes_trabajo
    FOR EACH ROW
    WHEN (NEW.estado = 'entregado' AND OLD.estado IS DISTINCT FROM 'entregado')
    EXECUTE FUNCTION fn_generar_factura_al_entregar();
  `;

  try {
    await pool.query(ddl);
    console.log("Tablas y funciones creadas/actualizadas correctamente.");

    // Igual que en el esquema anterior: solo sembramos datos de prueba
    // UNA vez. Si ya hay roles, asumimos que el resto ya está sembrado.
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

    // Usuario admin real, con contraseña utilizable (admin / admin123)
    const hashAdmin = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo)
      VALUES ('Administrador', 'admin', 'admin@taller.com', $1,
              (SELECT id FROM roles WHERE nombre = 'administrador'), true);
    `, [hashAdmin]);

    // NOTA: estos hashes son de relleno ($2b$10$hash1...), no
    // contraseñas reales; nadie puede loguearse con estas cuentas
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

    // numero_orden se genera solo (ORD-1, ORD-2, ... en orden de inserción)
    await pool.query(`
      INSERT INTO ordenes_trabajo (vehiculo_id, mecanico_id, fecha_ingreso, descripcion_problema, estado, prioridad) VALUES
      (1,  3, '2026-06-01', 'Ruido en el motor al acelerar', 'entregado',    1),
      (2,  4, '2026-06-03', 'Fallo en el sistema de frenos', 'listo',        2),
      (3,  5, '2026-06-05', 'No enciende el vehículo',        'en reparacion',3),
      (4,  7, '2026-06-07', 'Cambio de aceite y filtros',     'recibido',     0),
      (5,  3, '2026-06-08', 'Aire acondicionado no enfría',   'en reparacion',1),
      (6,  4, '2026-06-10', 'Revisión de suspensión',         'recibido',     1),
      (7,  5, '2026-06-11', 'Fuga de aceite en el motor',     'listo',        2),
      (8,  7, '2026-06-12', 'Cambio de banda de distribución','en reparacion',3),
      (9,  3, '2026-06-13', 'Revisión eléctrica general',     'entregado',    1),
      (10, 4, '2026-06-14', 'Alineación y balanceo',          'recibido',     0);
    `);

    await pool.query(`
      INSERT INTO historial_estados_orden (orden_id, estado, notas, usuario_id) VALUES
      ('ORD-1', 'recibido',      'Ingreso del vehículo al taller', 2),
      ('ORD-1', 'entregado',     'Vehículo entregado al cliente',  2),
      ('ORD-2', 'recibido',      'Ingreso del vehículo al taller', 2),
      ('ORD-2', 'listo',         'Reparación finalizada',          4),
      ('ORD-3', 'en reparacion', 'Diagnóstico eléctrico en curso',  5),
      ('ORD-4', 'recibido',      'Ingreso para mantenimiento',      6),
      ('ORD-5', 'en reparacion', 'Revisando compresor de A/C',      3),
      ('ORD-6', 'recibido',      'Ingreso del vehículo al taller',  6),
      ('ORD-7', 'listo',         'Fuga reparada',                   5),
      ('ORD-8', 'en reparacion', 'Cambiando banda de distribución', 7);
    `);

    await pool.query(`
      INSERT INTO diagnosticos (orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id) VALUES
      ('ORD-1', 'Desgaste en soportes de motor',       'Ruido más notorio en frío',       'Reemplazar soportes',            'completado', 3),
      ('ORD-2', 'Pastillas de freno desgastadas',      'Espesor menor al mínimo',         'Cambiar pastillas y discos',      'completado', 4),
      ('ORD-3', 'Falla en batería y alternador',       'Batería con baja carga',          'Reemplazar batería',              'en proceso', 5),
      ('ORD-4', 'Aceite y filtros vencidos',           'Aceite con sedimentos',           'Cambio de aceite sintético',       'pendiente',  7),
      ('ORD-5', 'Compresor de A/C dañado',             'Sin presión de gas refrigerante', 'Reemplazar compresor',            'en proceso', 3),
      ('ORD-6', 'Amortiguadores desgastados',          'Rebote excesivo en baches',       'Cambiar amortiguadores',           'pendiente',  4),
      ('ORD-7', 'Fuga por empaque de cárter',          'Manchas de aceite bajo el motor', 'Cambiar empaque',                 'completado', 5),
      ('ORD-8', 'Banda de distribución agrietada',     'Riesgo de rotura inminente',      'Reemplazo inmediato',             'en proceso', 7),
      ('ORD-9', 'Corto circuito en panel de luces',    'Fusible quemado repetidamente',   'Revisar cableado completo',        'completado', 3),
      ('ORD-10','Desalineación en eje delantero',      'Desgaste irregular de llantas',   'Alinear y balancear',             'pendiente',  4);
    `);

    await pool.query(`
      INSERT INTO evidencias_diagnostico (diagnostico_id, usuario_id, nombre_archivo, ruta_archivo, tipo_archivo, tamano_bytes) VALUES
      (1,  3, 'soporte_motor_01.jpg',      '/uploads/evidencias/1/soporte_motor_01.jpg',      'jpg',  845210),
      (2,  4, 'pastillas_freno_01.png',    '/uploads/evidencias/2/pastillas_freno_01.png',    'png',  612340),
      (3,  5, 'bateria_01.jpg',            '/uploads/evidencias/3/bateria_01.jpg',            'jpg',  733920),
      (4,  7, 'filtro_aceite_01.jpeg',     '/uploads/evidencias/4/filtro_aceite_01.jpeg',     'jpeg', 540120),
      (5,  3, 'compresor_ac_01.png',       '/uploads/evidencias/5/compresor_ac_01.png',       'png',  921450),
      (6,  4, 'amortiguador_01.jpg',       '/uploads/evidencias/6/amortiguador_01.jpg',       'jpg',  678900),
      (7,  5, 'carter_fuga_01.webp',       '/uploads/evidencias/7/carter_fuga_01.webp',       'webp', 455600),
      (8,  7, 'banda_distribucion_01.jpg', '/uploads/evidencias/8/banda_distribucion_01.jpg', 'jpg',  702340),
      (9,  3, 'panel_luces_01.png',        '/uploads/evidencias/9/panel_luces_01.png',        'png',  389750),
      (10, 4, 'llanta_desgaste_01.jpg',    '/uploads/evidencias/10/llanta_desgaste_01.jpg',   'jpg',  812430);
    `);

    await pool.query(`
      INSERT INTO categorias_repuestos (nombre) VALUES
      ('Frenos'), ('Motor'), ('Suspensión'), ('Eléctrico'), ('Transmisión'),
      ('Refrigeración'), ('Filtros'), ('Neumáticos'), ('Carrocería'), ('Aceites y Lubricantes');
    `);

    await pool.query(`
      INSERT INTO repuestos (codigo, nombre, categoria_id, costo_unitario, precio_unitario) VALUES
      ('REP-001', 'Pastillas de freno delanteras', 1, 500.00,  850.00),
      ('REP-002', 'Disco de freno',                1, 700.00,  1200.00),
      ('REP-003', 'Soporte de motor',              2, 380.00,  650.00),
      ('REP-004', 'Batería 12V',                   4, 1600.00, 2500.00),
      ('REP-005', 'Filtro de aceite',              7, 100.00,  180.00),
      ('REP-006', 'Filtro de aire',                7, 120.00,  220.00),
      ('REP-007', 'Amortiguador delantero',        3, 850.00,  1450.00),
      ('REP-008', 'Compresor de A/C',              4, 2600.00, 4200.00),
      ('REP-009', 'Banda de distribución',         5, 580.00,  980.00),
      ('REP-010', 'Aceite sintético 5W-30 (galón)',10, 450.00,  750.00);
    `);

    await pool.query(`
      INSERT INTO stock_repuestos (repuesto_id, cantidad_disponible, cantidad_minima) VALUES
      (1, 25, 5), (2, 18, 4), (3, 12, 3), (4, 8, 2), (5, 40, 10),
      (6, 35, 10), (7, 15, 3), (8, 5, 2), (9, 10, 3), (10, 22, 5);
    `);

    await pool.query(`
      INSERT INTO movimientos_inventario (repuesto_id, tipo_movimiento, cantidad, motivo, orden_id, usuario_id) VALUES
      (1, 'salida',  2, 'Uso en orden de trabajo',     'ORD-2', 4),
      (2, 'salida',  2, 'Uso en orden de trabajo',     'ORD-2', 4),
      (3, 'salida',  2, 'Uso en orden de trabajo',     'ORD-1', 3),
      (4, 'salida',  1, 'Uso en orden de trabajo',     'ORD-3', 5),
      (5, 'salida',  1, 'Uso en orden de trabajo',     'ORD-4', 7),
      (6, 'salida',  1, 'Uso en orden de trabajo',     'ORD-4', 7),
      (8, 'salida',  1, 'Uso en orden de trabajo',     'ORD-5', 3),
      (9, 'salida',  1, 'Uso en orden de trabajo',     'ORD-8', 7),
      (10,'entrada', 20,'Compra a proveedor',          NULL, 8),
      (1, 'entrada', 15,'Compra a proveedor',          NULL, 8);
    `);

    await pool.query(`
      INSERT INTO solicitudes_repuestos (orden_id, repuesto_id, cantidad_solicitada, costo_historico, precio_historico, mecanico_id) VALUES
      ('ORD-1', 3,  2, 380.00,  650.00,  3),
      ('ORD-2', 1,  2, 500.00,  850.00,  4),
      ('ORD-2', 2,  2, 700.00,  1200.00, 4),
      ('ORD-3', 4,  1, 1600.00, 2500.00, 5),
      ('ORD-4', 5,  1, 100.00,  180.00,  7),
      ('ORD-4', 6,  1, 120.00,  220.00,  7),
      ('ORD-4', 10, 4, 450.00,  750.00,  7),
      ('ORD-5', 8,  1, 2600.00, 4200.00, 3),
      ('ORD-7', 3,  1, 380.00,  650.00,  5),
      ('ORD-8', 9,  1, 580.00,  980.00,  7);
    `);

    await pool.query(`
      INSERT INTO servicio_catalogo (id, nombre, descripcion, precio_base) VALUES
      (1,  'Cambio de aceite',              'Cambio de aceite y filtro',                       450.00),
      (2,  'Alineación',                    'Alineación de las 4 ruedas',                      500.00),
      (3,  'Balanceo',                      'Balanceo de neumáticos',                          350.00),
      (4,  'Servicio de frenos',            'Revisión y cambio de pastillas/discos',           900.00),
      (5,  'Afinación de motor',            'Revisión general del motor',                      1500.00),
      (6,  'Diagnóstico computarizado',     'Escaneo electrónico del vehículo',                600.00),
      (7,  'Cambio de banda de distribución','Reemplazo de banda y revisión de tensores',      1800.00),
      (8,  'Reparación de motor',           'Reparación mayor de componentes internos',        5000.00),
      (9,  'Cambio de llantas',             'Montaje y desmontaje de neumáticos',              300.00),
      (10, 'Revisión eléctrica',            'Diagnóstico del sistema eléctrico completo',      700.00);
    `);

    await pool.query(`SELECT setval(pg_get_serial_sequence('servicio_catalogo','id'), 10, true);`);

    await pool.query(`
      INSERT INTO orden_servicio (orden_id, servicio_id, tiempo_empleado_minutos, observaciones, precio_aplicado) VALUES
      ('ORD-1', 5,  120, 'Afinación completa por ruido de motor',        1500.00),
      ('ORD-2', 4,  90,  'Cambio de pastillas y discos delanteros',      900.00),
      ('ORD-3', 6,  45,  'Escaneo para verificar falla eléctrica',       600.00),
      ('ORD-4', 1,  30,  'Cambio de aceite de rutina',                   450.00),
      ('ORD-5', 10, 60,  'Revisión de sistema de A/C',                   700.00),
      ('ORD-6', 2,  40,  'Alineación por desgaste irregular',            500.00),
      ('ORD-7', 8,  180, 'Reparación de fuga en cárter',                 5000.00),
      ('ORD-8', 7,  150, 'Reemplazo urgente de banda de distribución',   1800.00),
      ('ORD-9', 10, 50,  'Revisión eléctrica del panel de luces',        700.00),
      ('ORD-10',3,  30,  'Balanceo tras alineación',                     350.00);
    `);

    await pool.query(`
      INSERT INTO autorizaciones_cai (cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin, fecha_limite_emision) VALUES
      ('85FDAH-789ABC-DEF012-345678-9ABCDE-F12345-B9', '000-001-01', '000-001-01-00005458', '000-001-01-00010000', '2026-12-31');
    `);

    // ORD-1 y ORD-9 se insertaron directo como 'entregado' (no vía UPDATE),
    // así que el trigger trg_generar_factura_al_entregar no se disparó;
    // se simula aquí el resultado que el trigger habría generado solo.
    await pool.query(`
      INSERT INTO facturas (orden_id, cai_id, numero_factura, cliente_dni, cliente_nombre, cliente_direccion, metodo_pago, subtotal_exento, subtotal_gravado_15, fecha_emision) VALUES
      ('ORD-1', 1, '000-001-01-00005458', '0501199012345', 'Pedro Hernandez Reyes', 'Bo. El Centro, 2da Ave, El Centro, Choluteca, Choluteca', 'tarjeta',  0, 0, '2026-06-02'),
      ('ORD-9', 1, '000-001-01-00005459', '0401200187654', 'Oscar Chavez Rodas',    'Col. Las Palmas, Las Palmas, La Ceiba, Atlántida',       'efectivo', 0, 0, '2026-06-14');
    `);

    await pool.query(`
      INSERT INTO factura_detalle (factura_id, tipo, orden_servicio_id, descripcion, cantidad, costo_unitario) VALUES
      (1, 'servicio', 1, 'Afinación de motor: revisión general del motor', 1, 1500.00),
      (2, 'servicio', 9, 'Revisión eléctrica: diagnóstico del sistema eléctrico completo', 1, 700.00);
    `);

    await pool.query(`
      INSERT INTO factura_detalle (factura_id, tipo, solicitud_repuesto_id, descripcion, cantidad, costo_unitario) VALUES
      (1, 'repuesto', 1, 'Soporte de motor', 2, 650.00);
    `);

    console.log("Datos de prueba sembrados correctamente.");

  } catch (err) {
    console.error("Error completo al sincronizar base de datos:", err);
    throw err;
  }
};

module.exports = setupDatabase;