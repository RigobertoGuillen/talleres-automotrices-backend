/* Tipos enumerado*/
CREATE TYPE rol_nombre AS ENUM ('administrador','mecanico','recepcionista');
CREATE TYPE tipo_vehiculo AS ENUM ('Pickup','turismo','camioneta');
CREATE TYPE estado_diagnostico AS ENUM ('pendiente','en proceso','completado');
CREATE TYPE estado_orden AS ENUM ('recibido','en reparacion','listo','entregado');
CREATE TYPE estado_factura AS ENUM ('pagada','pendiente','vencida');
CREATE TYPE metodo_pago AS ENUM ('efectivo','tarjeta','transferencia');

/*USUARIOS, ROLES Y PERMISOS (HU-01, HU-02)*/
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

/*CLIENTES Y VEHICULOS (HU-03, HU-04, HU-05, HU-06)*/

CREATE TABLE direcciones(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	calle varchar(150) NOT NULL,
	colonia varchar(100) NOT NULL,
	ciudad varchar(80) NOT NULL,
	departamento varchar(80) NOT NULL,
	referencia text 
);

CREATE TABLE IF NOT EXISTS clientes(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre varchar(150) NOT NULL,
    telefono varchar(150) NOT NULL,
    correo varchar(150),
    direccion varchar(255),
    fecha_registro timestamptz NOT NULL DEFAULT now(),
    editado_por bigint REFERENCES usuarios(id),
    fecha_edicion timestamptz
);

CREATE UNIQUE INDEX clientes_correo_unico
	ON clientes (lower(correo))
	WHERE correo IS NOT NULL;

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
	marca varchar(50) NOT NULL,
	modelo varchar(50) NOT NULL,
	anio smallint NOT NULL
		CHECK (anio BETWEEN 1950 AND extract(year FROM now())::int + 1),
	color varchar(30),
	tipo tipo_vehiculo NOT NULL,
	cliente_id bigint NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
	fecha_registro timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vehiculos_clientes_idx ON vehiculos(cliente_id);
CREATE INDEX vehiculos_marca_idx ON vehiculos(marca);

/*ORDENES DE TRABAJO E HISTORIAL DE ESTADOS (HU-09, HU-10, HU-11, HU-08)*/

CREATE TABLE ordenes_trabajo(
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

CREATE INDEX ordenes_estado_idx ON ordenes_trabajo(estado);
CREATE INDEX ordenes_mecanico_idx ON ordenes_trabajo(mecanico_id);
CREATE INDEX ordenes_vehiculo_idx ON ordenes_trabajo(vehiculo_id);
CREATE INDEX ordenes_fecha_idx ON ordenes_trabajo(fecha_ingreso);

CREATE TABLE historial_estados_orden(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
	estado estado_orden NOT NULL,
	notas text,
	usuario_id bigint REFERENCES usuarios(id),
	fecha_hora timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX historial_orden_idx ON historial_estados_orden(orden_id);

/*DIAGNOSTICOS TECNICOS (HU-07)*/

CREATE TABLE diagnosticos(
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

CREATE INDEX diagnosticos_orden_idx ON diagnosticos(orden_id);

/*INVENTARIO DE REPUESTOS (HU-12, HU-13)*/

CREATE TABLE categorias_repuestos(
	id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nombre varchar(50) NOT NULL UNIQUE
);

CREATE TABLE repuestos(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	codigo varchar(30) NOT NULL UNIQUE,
	nombre varchar(150) NOT NULL,
	categoria_id smallint REFERENCES categorias_repuestos(id),
	precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >=0),
	fecha_creacion timestamptz NOT NULL DEFAULT now()
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
	orden_id bigint REFERENCES ordenes_trabajo(id),
	usuario_id bigint REFERENCES usuarios(id),
	fecha_hora timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mov_inventario_repuesto_idx ON movimientos_inventario(repuesto_id);
CREATE INDEX mov_inventario_orden_idx ON movimientos_inventario(orden_id);

CREATE TABLE solicitudes_repuestos(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
	repuesto_id bigint NOT NULL REFERENCES repuestos(id),
	cantidad_solicitada integer NOT NULL CHECK (cantidad_solicitada > 0),
	precio_historico numeric(10,2) NOT NULL,
	mecanico_id bigint REFERENCES usuarios(id),
	fecha_solicitud timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX solicitudes_orden_idx ON solicitudes_repuestos(orden_id);
CREATE INDEX solicitudes_repuesto_idx ON solicitudes_repuestos(repuesto_id);

/*SERVICIO REALIZADOS (HU-20)*/

CREATE TABLE servicio_catalogo(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nombre varchar(100) NOT NULL UNIQUE,
	descripcion text,
	precio_base numeric(10,2) NOT NULL DEFAULT 0 CHECK (precio_base >= 0)
	
);

CREATE TABLE orden_servicio(
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orden_id bigint NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
	servicio_id bigint NOT NULL REFERENCES servicio_catalogo(id),
	tiempo_empleado_minutos integer CHECK (tiempo_empleado_minutos >= 0),
	observaciones text,
	precio_aplicado numeric(10,2) NOT NULL CHECK (precio_aplicado >= 0),
	fecha_registro timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orden_servicios_orden_idx ON orden_servicio(orden_id);