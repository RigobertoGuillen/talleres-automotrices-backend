const Usuario = class Usuario {
  constructor({
    id,
    nombre_completo,
    nombre_usuario,
    correo,
    contrasena_hash,
    rol_id,
    rol,
    activo,
    fecha_creacion,
    fecha_actualizacion
  } = {}) {
    this.id = id;
    this.nombre_completo = nombre_completo;
    this.nombre_usuario = nombre_usuario;
    this.correo = correo;
    this.contrasena_hash = contrasena_hash;
    this.rol_id = rol_id;
    this.rol = rol;
    this.activo = activo !== undefined ? activo : true;
    this.fecha_creacion = fecha_creacion || new Date();
    this.fecha_actualizacion = fecha_actualizacion || new Date();
  }

  esActivo() {
    return this.activo === true;
  }

  esAdministrador() {
    return this.rol === 'administrador' || this.rol_id === 1;
  }

  esMecanico() {
    return this.rol === 'mecanico' || this.rol_id === 2;
  }

  esRecepcionista() {
    return this.rol === 'recepcionista' || this.rol_id === 3;
  }

  tieneRol(rolNombre) {
    return this.rol === rolNombre;
  }

  desactivar() {
    this.activo = false;
    this.fecha_actualizacion = new Date();
  }

  activar() {
    this.activo = true;
    this.fecha_actualizacion = new Date();
  }

  actualizarDatos(datos) {
    if (datos.nombre_completo) this.nombre_completo = datos.nombre_completo;
    if (datos.correo) this.correo = datos.correo;
    if (datos.rol_id) this.rol_id = datos.rol_id;
    this.fecha_actualizacion = new Date();
  }

  cambiarContrasena(nuevoHash) {
    this.contrasena_hash = nuevoHash;
    this.fecha_actualizacion = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      nombre_completo: this.nombre_completo,
      nombre_usuario: this.nombre_usuario,
      correo: this.correo,
      rol: this.rol,
      rol_id: this.rol_id,
      activo: this.activo,
      fecha_creacion: this.fecha_creacion,
      fecha_actualizacion: this.fecha_actualizacion
    };
  }

  toAuthPayload() {
    return {
      id: this.id,
      nombre_usuario: this.nombre_usuario,
      rol: this.rol
    };
  }

  toDatabase() {
    return {
      id: this.id,
      nombre_completo: this.nombre_completo,
      nombre_usuario: this.nombre_usuario,
      correo: this.correo,
      contrasena_hash: this.contrasena_hash,
      rol_id: this.rol_id,
      activo: this.activo,
      fecha_creacion: this.fecha_creacion,
      fecha_actualizacion: this.fecha_actualizacion
    };
  }

  static fromDatabase(data) {
    return new Usuario({
      id: data.id,
      nombre_completo: data.nombre_completo,
      nombre_usuario: data.nombre_usuario,
      correo: data.correo,
      contrasena_hash: data.contrasena_hash,
      rol_id: data.rol_id,
      rol: data.rol,
      activo: data.activo,
      fecha_creacion: data.fecha_creacion,
      fecha_actualizacion: data.fecha_actualizacion
    });
  }

  static forRegistration(data, hash) {
    return new Usuario({
      nombre_completo: data.nombre_completo,
      nombre_usuario: data.nombre_usuario,
      correo: data.correo,
      contrasena_hash: hash,
      rol_id: data.rol_id || 3,
      activo: true
    });
  }
};

module.exports = Usuario;