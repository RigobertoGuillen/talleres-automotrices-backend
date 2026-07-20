const Cliente = class Cliente {
  constructor({
    id,
    dni,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    telefono,
    correo,
    direccion_id,
    direccion = null,
    total_vehiculos = 0,
    vehiculos = [],
    fecha_registro
  } = {}) {
    this.id = id;
    this.dni = dni;
    this.primer_nombre = primer_nombre;
    this.segundo_nombre = segundo_nombre;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
    this.telefono = telefono;
    this.correo = correo;
    this.direccion_id = direccion_id;
    this.direccion = direccion;
    this.total_vehiculos = total_vehiculos;
    this.vehiculos = vehiculos;
    this.fecha_registro = fecha_registro || new Date();
  }

  get nombre_completo() {
    const nombres = [this.primer_nombre];
    if (this.segundo_nombre) nombres.push(this.segundo_nombre);
    const apellidos = [this.primer_apellido];
    if (this.segundo_apellido) apellidos.push(this.segundo_apellido);
    return [...nombres, ...apellidos].join(' ');
  }

  get nombre_corto() {
    return `${this.primer_nombre} ${this.primer_apellido}`;
  }

  get tiene_direccion() {
    return !!this.direccion;
  }

  get tiene_vehiculos() {
    return this.total_vehiculos > 0 || this.vehiculos.length > 0;
  }

  agregarVehiculo(vehiculo) {
    this.vehiculos.push(vehiculo);
    this.total_vehiculos++;
  }

  actualizarDatos(datos) {
    if (datos.primer_nombre) this.primer_nombre = datos.primer_nombre;
    if (datos.segundo_nombre !== undefined) this.segundo_nombre = datos.segundo_nombre;
    if (datos.primer_apellido) this.primer_apellido = datos.primer_apellido;
    if (datos.segundo_apellido !== undefined) this.segundo_apellido = datos.segundo_apellido;
    if (datos.telefono) this.telefono = datos.telefono;
    if (datos.correo !== undefined) this.correo = datos.correo;
    if (datos.direccion) this.direccion = datos.direccion;
  }

  validarDni() {
    return /^[0-9]{13}$/.test(this.dni);
  }

  validarTelefono() {
    return /^[0-9]{4}-[0-9]{4}$/.test(this.telefono);
  }

  validarCorreo() {
    if (!this.correo) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo);
  }

  esValido() {
    return (
      this.dni &&
      this.primer_nombre &&
      this.primer_apellido &&
      this.telefono &&
      this.validarDni() &&
      this.validarTelefono() &&
      this.validarCorreo()
    );
  }

  toJSON() {
    return {
      id: this.id,
      dni: this.dni,
      primer_nombre: this.primer_nombre,
      segundo_nombre: this.segundo_nombre,
      primer_apellido: this.primer_apellido,
      segundo_apellido: this.segundo_apellido,
      nombre_completo: this.nombre_completo,
      telefono: this.telefono,
      correo: this.correo,
      direccion: this.direccion,
      direccion_id: this.direccion_id,
      total_vehiculos: this.total_vehiculos,
      vehiculos: this.vehiculos,
      fecha_registro: this.fecha_registro
    };
  }

  toDatabase() {
    return {
      id: this.id,
      dni: this.dni,
      primer_nombre: this.primer_nombre,
      segundo_nombre: this.segundo_nombre,
      primer_apellido: this.primer_apellido,
      segundo_apellido: this.segundo_apellido,
      telefono: this.telefono,
      correo: this.correo,
      direccion_id: this.direccion_id,
      fecha_registro: this.fecha_registro
    };
  }

  static fromDatabase(data) {
    return new Cliente({
      id: data.id,
      dni: data.dni,
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido,
      telefono: data.telefono,
      correo: data.correo,
      direccion_id: data.direccion_id,
      direccion: data.direccion,
      total_vehiculos: data.total_vehiculos || 0,
      vehiculos: data.vehiculos || [],
      fecha_registro: data.fecha_registro
    });
  }

  static forRegistration(data) {
    return new Cliente({
      dni: data.dni,
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre || null,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido || null,
      telefono: data.telefono,
      correo: data.correo || null,
      direccion: data.direccion || null
    });
  }
};

module.exports = Cliente;