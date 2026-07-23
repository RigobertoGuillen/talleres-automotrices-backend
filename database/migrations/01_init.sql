-- ---------------------------------------------------------
-- 2. TIPOS ENUMERADOS
-- ---------------------------------------------------------
CREATE TYPE rol_nombre AS ENUM ('administrador','mecanico','recepcionista');
CREATE TYPE tipo_vehiculo AS ENUM ('Pickup','turismo','camioneta');
CREATE TYPE estado_diagnostico AS ENUM ('pendiente','en proceso','completado');
CREATE TYPE estado_orden AS ENUM ('recibido','en reparacion','listo','entregado');
CREATE TYPE metodo_pago AS ENUM ('efectivo','tarjeta','transferencia');
CREATE TYPE tipo_detalle_factura AS ENUM ('servicio','repuesto');

-- ---------------------------------------------------------
-- 3. USUARIOS, ROLES Y PERMISOS
-- ---------------------------------------------------------
CREATE TABLE roles(
	id 	smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nombre 	rol_nombre NOT NULL UNIQUE,
	descripcion	varchar(200)
);

CREATE TABLE usuarios(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nombre_completo	varchar(150) NOT NULL,
	nombre_usuario varchar(50) NOT NULL UNIQUE,
	correo varchar(150) NOT NULL UNIQUE,
	contrasena_hash varchar(255) NOT NULL,
	rol_id smallint NOT NULL REFERENCES roles(id),
	activo boolean NOT NULL DEFAULT true,
	fecha_creacion timestamptz NOT NULL DEFAULT now(),
	fecha_actualizacion timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 3.1 RECUPERACION DE CONTRASENA
-- Una sola tabla sirve para los 3 roles, ya que todos son
-- usuarios de la misma tabla usuarios (se distinguen por rol_id).
-- El token NUNCA se guarda en texto plano: se hashea igual que
-- la contrasena, y el que se envia por correo es el valor sin
-- hashear (solo existe en el link del correo, no en la BD).
-- ---------------------------------------------------------
CREATE TABLE tokens_recuperacion_password(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	usuario_id bigint NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
	token_hash varchar(255) NOT NULL UNIQUE,
	fecha_expiracion timestamptz NOT NULL,
	usado boolean NOT NULL DEFAULT false,
	fecha_creacion timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tokens_recuperacion_usuario_idx ON tokens_recuperacion_password(usuario_id);

CREATE TABLE modulos(
	id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nombre varchar(50) NOT NULL UNIQUE,
	descripcion varchar(150)
);

CREATE TABLE permisos_rol(
	rol_id	smallint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
	modulo_id smallint NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
	puede_ver boolean NOT NULL DEFAULT false,
	puede_editar	boolean NOT NULL DEFAULT false,
	puede_eliminar	boolean NOT NULL DEFAULT false,
	PRIMARY KEY (rol_id, modulo_id)
);

-- ---------------------------------------------------------
-- 4. CLIENTES Y VEHICULOS (normalizado)
-- ---------------------------------------------------------
CREATE TABLE direcciones(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	calle varchar(150) NOT NULL,
	colonia varchar(100) NOT NULL,
	ciudad varchar(80) NOT NULL,
	departamento varchar(80) NOT NULL,
	referencia text
);

CREATE TABLE clientes(
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

CREATE UNIQUE INDEX clientes_dni_unico
	ON clientes (lower(dni))
	WHERE dni IS NOT NULL;

CREATE TABLE auditoria_clientes (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	cliente_id bigint NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
	campo_modificado varchar(50) NOT NULL,
	valor_anterior text,
	valor_nuevo text,
	fecha_hora timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auditoria_clientes_idx ON auditoria_clientes(cliente_id);

CREATE TABLE marcas_vehiculo(
	id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nombre varchar(50) NOT NULL UNIQUE
);

CREATE TABLE vehiculos(
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

CREATE INDEX vehiculos_clientes_idx ON vehiculos(cliente_id);
CREATE INDEX vehiculos_marca_idx ON vehiculos(marca_id);

-- ---------------------------------------------------------
-- 5. ORDENES DE TRABAJO E HISTORIAL DE ESTADOS
-- CORRECCION: numero_orden reemplaza al id numerico y ahora es
-- la PK de la tabla. Se autogenera como 'ORD-' + secuencia.
-- ---------------------------------------------------------
CREATE SEQUENCE ordenes_trabajo_numero_seq;

CREATE TABLE ordenes_trabajo(
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

CREATE INDEX ordenes_estado_idx ON ordenes_trabajo(estado);
CREATE INDEX ordenes_mecanico_idx ON ordenes_trabajo(mecanico_id);
CREATE INDEX ordenes_vehiculo_idx ON ordenes_trabajo(vehiculo_id);
CREATE INDEX ordenes_fecha_idx ON ordenes_trabajo(fecha_ingreso);

CREATE TABLE historial_estados_orden(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orden_id varchar(20) NOT NULL REFERENCES ordenes_trabajo(numero_orden) ON DELETE CASCADE,
	estado estado_orden NOT NULL,
	notas text,
	usuario_id bigint REFERENCES usuarios(id),
	fecha_hora timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX historial_orden_idx ON historial_estados_orden(orden_id);

-- ---------------------------------------------------------
-- 6. DIAGNOSTICOS TECNICOS
-- ---------------------------------------------------------
CREATE TABLE diagnosticos(
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

CREATE INDEX diagnosticos_orden_idx ON diagnosticos(orden_id);

-- ---------------------------------------------------------
-- 6.1 EVIDENCIAS FOTOGRAFICAS DEL DIAGNOSTICO
-- Se asocia al diagnostico (y por lo tanto a la orden via
-- diagnosticos.orden_id). El mecanico solo sube la foto; la
-- descripcion de la falla ya vive en diagnosticos.descripcion_falla,
-- asi que no se duplica aqui. ruta_archivo es la ubicacion en el
-- storage del sistema (no un enlace externo, el mecanico no pega
-- una URL, sube el archivo). El formato de imagen se valida con
-- un CHECK a nivel de BD y tambien debe validarse en el backend
-- (mimetype real, no solo extension).
-- ---------------------------------------------------------
CREATE TABLE evidencias_diagnostico(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	diagnostico_id bigint NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
	usuario_id bigint NOT NULL REFERENCES usuarios(id),
	nombre_archivo varchar(255) NOT NULL,
	ruta_archivo text NOT NULL,
	tipo_archivo varchar(10) NOT NULL CHECK (tipo_archivo IN ('jpg','jpeg','png','webp')),
	tamano_bytes integer NOT NULL CHECK (tamano_bytes > 0 AND tamano_bytes <= 5242880),
	fecha_subida timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX evidencias_diagnostico_idx ON evidencias_diagnostico(diagnostico_id);
CREATE INDEX evidencias_usuario_idx ON evidencias_diagnostico(usuario_id);

-- ---------------------------------------------------------
-- 7. INVENTARIO DE REPUESTOS
-- ---------------------------------------------------------
CREATE TABLE categorias_repuestos(
	id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nombre varchar(50) NOT NULL UNIQUE
);

CREATE TABLE repuestos(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo varchar(30) NOT NULL UNIQUE,
	nombre varchar(150) NOT NULL,
	categoria_id smallint REFERENCES categorias_repuestos(id),
	costo_unitario numeric(10,2) NOT NULL CHECK (costo_unitario >= 0),
	precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
	fecha_creacion timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT precio_mayor_o_igual_costo CHECK (precio_unitario >= costo_unitario)
);

CREATE INDEX repuestos_categoria_idx ON repuestos(categoria_id);

CREATE TABLE stock_repuestos(
	repuesto_id bigint PRIMARY KEY REFERENCES repuestos(id) ON DELETE CASCADE,
	cantidad_disponible integer NOT NULL DEFAULT 0 CHECK (cantidad_disponible >=0),
	cantidad_minima integer NOT NULL DEFAULT 0 CHECK (cantidad_minima >=0),
	fecha_actualizacion timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE movimientos_inventario(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	repuesto_id bigint NOT NULL REFERENCES repuestos(id),
	tipo_movimiento varchar(10) NOT NULL CHECK (tipo_movimiento IN ('entrada','salida')),
	cantidad integer NOT NULL CHECK (cantidad > 0),
	motivo varchar(100),
	orden_id varchar(20) REFERENCES ordenes_trabajo(numero_orden),
	usuario_id bigint REFERENCES usuarios(id),
	fecha_hora timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mov_inventario_repuesto_idx ON movimientos_inventario(repuesto_id);
CREATE INDEX mov_inventario_orden_idx ON movimientos_inventario(orden_id);

CREATE TABLE solicitudes_repuestos(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orden_id varchar(20) NOT NULL REFERENCES ordenes_trabajo(numero_orden) ON DELETE CASCADE,
	repuesto_id bigint NOT NULL REFERENCES repuestos(id),
	cantidad_solicitada integer NOT NULL CHECK (cantidad_solicitada > 0),
	costo_historico numeric(10,2) NOT NULL,
	precio_historico numeric(10,2) NOT NULL,
	mecanico_id bigint REFERENCES usuarios(id),
	fecha_solicitud timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX solicitudes_orden_idx ON solicitudes_repuestos(orden_id);
CREATE INDEX solicitudes_repuesto_idx ON solicitudes_repuestos(repuesto_id);

-- ---------------------------------------------------------
-- 8. SERVICIOS REALIZADOS
-- CORRECCION: id ahora se inserta explicitamente, por lo que
-- se cambia a GENERATED BY DEFAULT AS IDENTITY.
-- ---------------------------------------------------------
CREATE TABLE servicio_catalogo(
	id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
	nombre varchar(100) NOT NULL UNIQUE,
	descripcion text,
	precio_base numeric(10,2) NOT NULL DEFAULT 0 CHECK (precio_base >= 0)
);

CREATE TABLE orden_servicio(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orden_id varchar(20) NOT NULL REFERENCES ordenes_trabajo(numero_orden) ON DELETE CASCADE,
	servicio_id bigint NOT NULL REFERENCES servicio_catalogo(id),
	tiempo_empleado_minutos integer CHECK (tiempo_empleado_minutos >= 0),
	observaciones text,
	precio_aplicado numeric(10,2) NOT NULL CHECK (precio_aplicado >= 0),
	fecha_registro timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orden_servicios_orden_idx ON orden_servicio(orden_id);

-- ---------------------------------------------------------
-- 8.1 FACTURACION (rediseño CAI / SAR Honduras)
-- Una factura por orden (se emite cuando la orden queda 'entregado').
-- El UNIQUE en orden_id ya garantiza que no se facture dos veces
-- la misma orden, sin necesidad de trigger.
--
-- El CAI (Codigo de Autorizacion de Impresion) lo emite el SAR por
-- LOTE de facturas, no por factura individual: un mismo CAI trae un
-- rango autorizado (ej. 000-001-01-00005458 al 000-001-01-00010000)
-- y una fecha limite de emision (ej. 31/12/2026). Por eso vive en su
-- propia tabla y facturas solo la referencia; asi un mismo CAI puede
-- amparar miles de facturas sin repetir sus datos en cada una.
-- El codigo CAI se guarda con la nomenclatura del SAR: 6 grupos de 6
-- caracteres alfanumericos + 1 grupo final de 2, separados por guion
-- (ej. 85FDAH-789ABC-DEF012-345678-9ABCDE-F12345-B9), 44 caracteres.
-- ---------------------------------------------------------
CREATE TABLE autorizaciones_cai(
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

-- Datos del cliente (dni, nombre, direccion) se guardan como "foto" en
-- la factura porque es un documento fiscal: si el cliente actualiza
-- su direccion despues, la factura ya emitida NO debe cambiar.
CREATE TABLE facturas(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orden_id varchar(20) NOT NULL UNIQUE REFERENCES ordenes_trabajo(numero_orden),
	cai_id smallint NOT NULL REFERENCES autorizaciones_cai(id),
	numero_factura varchar(19) NOT NULL UNIQUE
		CHECK (numero_factura ~ '^[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8}$'),
	cliente_dni varchar(13) NOT NULL,
	cliente_nombre varchar(300) NOT NULL,
	cliente_direccion text,
	-- Nulo al momento de generarse (todavia no se ha cobrado); se llena
	-- cuando el cliente paga, ver seccion 8.3.
	metodo_pago metodo_pago,
	subtotal_exento numeric(10,2) NOT NULL DEFAULT 0 CHECK (subtotal_exento >= 0),
	subtotal_gravado_15 numeric(10,2) NOT NULL DEFAULT 0 CHECK (subtotal_gravado_15 >= 0),
	isv_15 numeric(10,2) GENERATED ALWAYS AS (round(subtotal_gravado_15 * 0.15, 2)) STORED,
	total numeric(10,2) GENERATED ALWAYS AS
		(subtotal_exento + subtotal_gravado_15 + round(subtotal_gravado_15 * 0.15, 2)) STORED,
	fecha_emision timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX facturas_orden_idx ON facturas(orden_id);
CREATE INDEX facturas_cai_idx ON facturas(cai_id);

-- Valida en cada INSERT/UPDATE que la factura respete lo autorizado
-- por su CAI: numero_factura dentro del rango y fecha_emision antes
-- de la fecha limite. No se puede hacer con un CHECK porque un CHECK
-- no puede leer otra tabla.
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

CREATE TRIGGER trg_validar_factura_cai
BEFORE INSERT OR UPDATE ON facturas
FOR EACH ROW EXECUTE FUNCTION fn_validar_factura_cai();

-- ---------------------------------------------------------
-- 8.2 DETALLE DE FACTURA (servicios y materiales facturados)
-- Cada renglon es un servicio (orden_servicio) o un repuesto
-- (solicitudes_repuestos) ya aplicado a la orden; se copia su
-- descripcion y costo al momento de facturar (foto fiscal, igual
-- que los datos del cliente) para que la factura no cambie aunque
-- despues se edite el precio en el catalogo o en el inventario.
-- ---------------------------------------------------------
CREATE TABLE factura_detalle(
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

CREATE INDEX factura_detalle_factura_idx ON factura_detalle(factura_id);
CREATE INDEX factura_detalle_orden_servicio_idx ON factura_detalle(orden_servicio_id);
CREATE INDEX factura_detalle_solicitud_repuesto_idx ON factura_detalle(solicitud_repuesto_id);

-- Mantiene facturas.subtotal_gravado_15 sincronizado con la suma de
-- los renglones de factura_detalle, para no depender de que el
-- backend calcule bien la suma cada vez que agrega/quita un renglon.
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

CREATE TRIGGER trg_recalcular_subtotal_factura
AFTER INSERT OR UPDATE OR DELETE ON factura_detalle
FOR EACH ROW EXECUTE FUNCTION fn_recalcular_subtotal_factura();

-- ---------------------------------------------------------
-- 8.3 AUTOGENERACION DE FACTURA AL ENTREGAR LA ORDEN
-- Cuando ordenes_trabajo.estado cambia a 'entregado', se genera la
-- factura sola: toma el CAI activo y vigente, calcula el siguiente
-- numero_factura dentro de su rango autorizado, copia los datos del
-- cliente (dni/nombre/direccion) y copia a factura_detalle todos los
-- servicios (orden_servicio) y repuestos (solicitudes_repuestos) que
-- ya estan registrados en esa orden. metodo_pago queda NULL porque
-- el pago se registra despues (UPDATE facturas SET metodo_pago = ...
-- al momento de cobrar). subtotal_gravado_15/isv_15/total quedan
-- correctos solos gracias al trigger de 8.2.
-- ---------------------------------------------------------
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

	-- Ya facturada (no debería pasar, pero evita un error feo de UNIQUE)
	IF EXISTS (SELECT 1 FROM facturas WHERE orden_id = NEW.numero_orden) THEN
		RETURN NEW;
	END IF;

	-- CAI activo y todavia vigente (fecha limite no vencida)
	SELECT * INTO v_cai
	FROM autorizaciones_cai
	WHERE activo = true AND fecha_limite_emision >= current_date
	ORDER BY id DESC
	LIMIT 1;

	IF v_cai.id IS NULL THEN
		RAISE EXCEPTION 'No hay un CAI activo y vigente para facturar la orden %', NEW.numero_orden;
	END IF;

	-- Siguiente numero de factura dentro del rango de ese CAI
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

	-- Cliente dueño del vehiculo de la orden (foto fiscal)
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

	-- Copia los servicios ya aplicados a la orden
	INSERT INTO factura_detalle (factura_id, tipo, orden_servicio_id, descripcion, cantidad, costo_unitario)
	SELECT v_factura_id, 'servicio', os.id,
		sc.nombre || COALESCE(': ' || os.observaciones, ''),
		1, os.precio_aplicado
	FROM orden_servicio os
	JOIN servicio_catalogo sc ON sc.id = os.servicio_id
	WHERE os.orden_id = NEW.numero_orden;

	-- Copia los repuestos ya solicitados para la orden
	INSERT INTO factura_detalle (factura_id, tipo, solicitud_repuesto_id, descripcion, cantidad, costo_unitario)
	SELECT v_factura_id, 'repuesto', sr.id, rp.nombre, sr.cantidad_solicitada, sr.precio_historico
	FROM solicitudes_repuestos sr
	JOIN repuestos rp ON rp.id = sr.repuesto_id
	WHERE sr.orden_id = NEW.numero_orden;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_factura_al_entregar
AFTER UPDATE ON ordenes_trabajo
FOR EACH ROW
WHEN (NEW.estado = 'entregado' AND OLD.estado IS DISTINCT FROM 'entregado')
EXECUTE FUNCTION fn_generar_factura_al_entregar();

-- =========================================================
-- 9. DATOS DE PRUEBA
-- =========================================================

-- ROLES
INSERT INTO roles (nombre, descripcion) VALUES
('administrador', 'Acceso total al sistema'),
('mecanico', 'Encargado de diagnósticos y reparaciones'),
('recepcionista', 'Atención al cliente y registro de órdenes');

-- USUARIOS
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

-- MODULOS
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

-- PERMISOS_ROL (administrador con acceso completo a los 10 módulos)
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

-- DIRECCIONES
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

-- CLIENTES
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

-- AUDITORIA_CLIENTES
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

-- MARCAS_VEHICULO
INSERT INTO marcas_vehiculo (nombre) VALUES
('Toyota'), ('Nissan'), ('Honda'), ('Mazda'), ('Hyundai'),
('Kia'), ('Chevrolet'), ('Ford'), ('Mitsubishi'), ('Suzuki');

-- VEHICULOS
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

-- ORDENES_TRABAJO
-- numero_orden se genera solo (ORD-1, ORD-2, ... en orden de insercion)
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

-- HISTORIAL_ESTADOS_ORDEN
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

-- DIAGNOSTICOS
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

-- EVIDENCIAS_DIAGNOSTICO (subidas por mecanico/administrador)
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

-- CATEGORIAS_REPUESTOS
INSERT INTO categorias_repuestos (nombre) VALUES
('Frenos'), ('Motor'), ('Suspensión'), ('Eléctrico'), ('Transmisión'),
('Refrigeración'), ('Filtros'), ('Neumáticos'), ('Carrocería'), ('Aceites y Lubricantes');

-- REPUESTOS
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

-- STOCK_REPUESTOS
INSERT INTO stock_repuestos (repuesto_id, cantidad_disponible, cantidad_minima) VALUES
(1, 25, 5),
(2, 18, 4),
(3, 12, 3),
(4, 8,  2),
(5, 40, 10),
(6, 35, 10),
(7, 15, 3),
(8, 5,  2),
(9, 10, 3),
(10,22, 5);

-- MOVIMIENTOS_INVENTARIO
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

-- SOLICITUDES_REPUESTOS
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

-- SERVICIO_CATALOGO
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

-- Asegura que la secuencia interna de la IDENTITY continue despues de los ids 1-10
SELECT setval(pg_get_serial_sequence('servicio_catalogo','id'), 10, true);

-- ORDEN_SERVICIO
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

-- AUTORIZACIONES_CAI
-- Lote autorizado por el SAR: rango 000-001-01-00005458 al
-- 000-001-01-00010000, vigente para emitir hasta el 31/12/2026.
INSERT INTO autorizaciones_cai (cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin, fecha_limite_emision) VALUES
('85FDAH-789ABC-DEF012-345678-9ABCDE-F12345-B9', '000-001-01', '000-001-01-00005458', '000-001-01-00010000', '2026-12-31');

-- FACTURAS
-- Solo se factura una orden cuando queda en estado 'entregado'. En uso
-- normal esto lo hace solo el trigger trg_generar_factura_al_entregar
-- (seccion 8.3) al hacer UPDATE ordenes_trabajo SET estado='entregado'.
-- Aqui, como las ordenes de prueba se insertan directo con estado
-- 'entregado' (via INSERT, no UPDATE), el trigger no se dispara, asi
-- que para ORD-1 y ORD-9 (las unicas 'entregado' entre las 10 de
-- prueba) se insertan la factura y su detalle a mano para simular
-- el resultado que el trigger habria generado solo.
-- ORD-1 (cliente 1, Pedro Hernandez Reyes): servicio 1500.00 + repuestos
--   2 x 650.00 = 1300.00 -> subtotal_gravado_15 2800.00 (se recalcula solo
--   al insertar factura_detalle, aqui se deja en 0 como valor inicial)
-- ORD-9 (cliente 9, Oscar Chavez Rodas): solo servicio 700.00, sin repuestos
INSERT INTO facturas (orden_id, cai_id, numero_factura, cliente_dni, cliente_nombre, cliente_direccion, metodo_pago, subtotal_exento, subtotal_gravado_15, fecha_emision) VALUES
('ORD-1', 1, '000-001-01-00005458', '0501199012345', 'Pedro Hernandez Reyes', 'Bo. El Centro, 2da Ave, El Centro, Choluteca, Choluteca', 'tarjeta',  0, 0, '2026-06-02'),
('ORD-9', 1, '000-001-01-00005459', '0401200187654', 'Oscar Chavez Rodas',    'Col. Las Palmas, Las Palmas, La Ceiba, Atlántida',       'efectivo', 0, 0, '2026-06-14');

-- FACTURA_DETALLE
-- factura_id 1 = ORD-1, factura_id 2 = ORD-9 (segun orden de insercion).
-- orden_servicio_id / solicitud_repuesto_id apuntan al renglon original
-- que ya existia en orden_servicio / solicitudes_repuestos.
INSERT INTO factura_detalle (factura_id, tipo, orden_servicio_id, descripcion, cantidad, costo_unitario) VALUES
(1, 'servicio', 1, 'Afinación de motor: revisión general del motor', 1, 1500.00),
(2, 'servicio', 9, 'Revisión eléctrica: diagnóstico del sistema eléctrico completo', 1, 700.00);

INSERT INTO factura_detalle (factura_id, tipo, solicitud_repuesto_id, descripcion, cantidad, costo_unitario) VALUES
(1, 'repuesto', 1, 'Soporte de motor', 2, 650.00);

-- =========================================================
-- 10. CONSULTAS DE EJEMPLO CON JOIN
-- =========================================================

-- 10.1 Vehiculos propios de un cliente
SELECT
	c.primer_nombre,
	c.primer_apellido,
	v.placa,
	v.modelo,
	v.anio,
	v.color
FROM clientes c
JOIN vehiculos v ON v.cliente_id = c.id
WHERE c.id = 1;

-- 10.2 Buscar un vehiculo por placa y ver a nombre de que cliente esta
SELECT
	v.placa,
	v.modelo,
	v.anio,
	c.primer_nombre,
	c.primer_apellido,
	c.telefono,
	c.correo
FROM vehiculos v
JOIN clientes c ON c.id = v.cliente_id
WHERE v.placa = 'PBH1234';

-- 10.3 Verificar si una orden se puede borrar
-- (si ya tiene diagnostico, el DELETE de la orden falla solo por la
-- restriccion de llave foranea en diagnosticos.orden_id; esta consulta
-- sirve para que el backend avise ANTES de intentar el DELETE)
SELECT
	o.numero_orden,
	o.estado,
	COUNT(d.id) AS diagnosticos_registrados,
	(COUNT(d.id) = 0) AS se_puede_borrar
FROM ordenes_trabajo o
LEFT JOIN diagnosticos d ON d.orden_id = o.numero_orden
WHERE o.numero_orden = 'ORD-4'
GROUP BY o.numero_orden, o.estado;

-- 10.4 Historial simple de una orden que aun esta en proceso / no finalizada
-- (mientras no haya diagnostico o la orden no este 'entregado', el
-- historial se ve tal cual, solo con sus cambios de estado)
SELECT
	h.orden_id,
	h.estado,
	h.notas,
	h.fecha_hora,
	u.nombre_completo AS registrado_por
FROM historial_estados_orden h
JOIN usuarios u ON u.id = h.usuario_id
WHERE h.orden_id = 'ORD-6'
ORDER BY h.fecha_hora;

-- 10.5 Historial completo de una orden ya finalizada (entregado):
-- diagnostico, mecanico, imagenes, y el detalle real de la factura
-- (servicios y repuestos facturados, con su CAI y rango autorizado)
SELECT
	o.numero_orden,
	o.estado,
	m.nombre_completo   AS mecanico,
	d.descripcion_falla,
	d.recomendaciones,
	ev.nombre_archivo   AS imagen_evidencia,
	ev.ruta_archivo,
	f.numero_factura,
	f.cliente_nombre,
	f.metodo_pago,
	fd.tipo             AS tipo_renglon,
	fd.descripcion      AS detalle_facturado,
	fd.cantidad,
	fd.costo_unitario,
	fd.monto_gravado,
	f.subtotal_exento,
	f.subtotal_gravado_15,
	f.isv_15,
	f.total,
	ac.cai,
	ac.rango_autorizado_inicio,
	ac.rango_autorizado_fin,
	ac.fecha_limite_emision
FROM ordenes_trabajo o
JOIN usuarios m                     ON m.id = o.mecanico_id
LEFT JOIN diagnosticos d            ON d.orden_id = o.numero_orden
LEFT JOIN evidencias_diagnostico ev ON ev.diagnostico_id = d.id
LEFT JOIN facturas f                ON f.orden_id = o.numero_orden
LEFT JOIN factura_detalle fd        ON fd.factura_id = f.id
LEFT JOIN autorizaciones_cai ac     ON ac.id = f.cai_id
WHERE o.numero_orden = 'ORD-1'
	AND o.estado = 'entregado';

-- =========================================================
-- 11. REPORTES DE ADMINISTRADOR
-- La "ganancia" se calcula sobre facturas.total, que es lo unico
-- que representa dinero cobrado en el esquema actual (no existe
-- una tabla de costos operativos, solo precios de venta).
-- =========================================================

-- 11.1 Ganancia total de la empresa (sin filtro)
SELECT SUM(total) AS ganancia_total
FROM facturas;

-- 11.2 Ganancia total filtrada por dia
SELECT
	date(fecha_emision) AS dia,
	SUM(total) AS ganancia_total
FROM facturas
GROUP BY date(fecha_emision)
ORDER BY dia DESC;

-- 11.3 Ganancia total filtrada por mes
SELECT
	date_trunc('month', fecha_emision)::date AS mes,
	SUM(total) AS ganancia_total
FROM facturas
GROUP BY date_trunc('month', fecha_emision)
ORDER BY mes DESC;

-- 11.4 Ganancia total filtrada por año
SELECT
	extract(year FROM fecha_emision)::int AS anio,
	SUM(total) AS ganancia_total
FROM facturas
GROUP BY extract(year FROM fecha_emision)
ORDER BY anio DESC;

-- 11.4.1 Ganancia NETA (ingresos de la factura menos costo de los repuestos
-- usados en esa orden). La mano de obra ya es ganancia completa porque
-- servicio_catalogo.precio_base la fija el admin sin un costo aparte.
SELECT
	f.numero_factura,
	f.fecha_emision,
	f.total AS ingreso,
	COALESCE(costos.costo_repuestos, 0) AS costo_repuestos,
	f.total - COALESCE(costos.costo_repuestos, 0) AS ganancia_neta
FROM facturas f
LEFT JOIN (
	SELECT orden_id, SUM(costo_historico * cantidad_solicitada) AS costo_repuestos
	FROM solicitudes_repuestos
	GROUP BY orden_id
) costos ON costos.orden_id = f.orden_id
ORDER BY f.fecha_emision DESC;

-- 11.4.2 Ganancia NETA total filtrada por mes
SELECT
	date_trunc('month', f.fecha_emision)::date AS mes,
	SUM(f.total) AS ingresos,
	SUM(COALESCE(costos.costo_repuestos, 0)) AS costos,
	SUM(f.total) - SUM(COALESCE(costos.costo_repuestos, 0)) AS ganancia_neta
FROM facturas f
LEFT JOIN (
	SELECT orden_id, SUM(costo_historico * cantidad_solicitada) AS costo_repuestos
	FROM solicitudes_repuestos
	GROUP BY orden_id
) costos ON costos.orden_id = f.orden_id
GROUP BY date_trunc('month', f.fecha_emision)
ORDER BY mes DESC;

-- 11.5 Historial de facturas (con orden, vehiculo, cliente y CAI)
SELECT
	f.numero_factura,
	f.fecha_emision,
	f.metodo_pago,
	f.subtotal_exento,
	f.subtotal_gravado_15,
	f.isv_15,
	f.total,
	ac.cai,
	ac.fecha_limite_emision,
	o.numero_orden,
	v.placa,
	c.primer_nombre,
	c.primer_apellido
FROM facturas f
JOIN ordenes_trabajo o     ON o.numero_orden = f.orden_id
JOIN vehiculos v            ON v.id = o.vehiculo_id
JOIN clientes c             ON c.id = v.cliente_id
JOIN autorizaciones_cai ac  ON ac.id = f.cai_id
ORDER BY f.fecha_emision DESC;

-- 11.6 Historial de vehiculos (todos, con dueño y cantidad de ordenes)
SELECT
	v.placa,
	mv.nombre AS marca,
	v.modelo,
	v.anio,
	c.primer_nombre,
	c.primer_apellido,
	COUNT(o.numero_orden) AS total_ordenes
FROM vehiculos v
JOIN clientes c        ON c.id = v.cliente_id
JOIN marcas_vehiculo mv ON mv.id = v.marca_id
LEFT JOIN ordenes_trabajo o ON o.vehiculo_id = v.id
GROUP BY v.id, v.placa, mv.nombre, v.modelo, v.anio, c.primer_nombre, c.primer_apellido
ORDER BY v.placa;

-- 11.7 Historial detallado de un vehiculo especifico (todas sus ordenes)
SELECT
	v.placa,
	o.numero_orden,
	o.fecha_ingreso,
	o.estado,
	o.descripcion_problema,
	d.descripcion_falla,
	f.numero_factura,
	f.total
FROM vehiculos v
JOIN ordenes_trabajo o      ON o.vehiculo_id = v.id
LEFT JOIN diagnosticos d    ON d.orden_id = o.numero_orden
LEFT JOIN facturas f        ON f.orden_id = o.numero_orden
WHERE v.placa = 'PBH1234'
ORDER BY o.fecha_ingreso DESC;

COMMIT;
