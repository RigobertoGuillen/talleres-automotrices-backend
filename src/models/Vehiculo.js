const Vehiculo = class Vehiculo {
  constructor({
    id,
    placa,
    marca_id,
    marca,
    modelo,
    anio,
    color,
    tipo,
    cliente_id,
    fecha_registro
  } = {}) {
    this.id = id;
    this.placa = placa;
    this.marca_id = marca_id;
    this.marca = marca;
    this.modelo = modelo;
    this.anio = anio;
    this.color = color;
    this.tipo = tipo;
    this.cliente_id = cliente_id;
    this.fecha_registro = fecha_registro || new Date();
  }

  static get TIPOS_VALIDOS() {
    return ['Pickup', 'turismo', 'camioneta'];
  }

  get descripcion() {
    return `${this.marca || 'Marca'} ${this.modelo} ${this.anio}`;
  }

  get es_pickup() {
    return this.tipo === 'Pickup';
  }

  get es_turismo() {
    return this.tipo === 'turismo';
  }

  get es_camioneta() {
    return this.tipo === 'camioneta';
  }

  validarPlaca() {
    return /^[A-Z0-9]{3,15}$/.test(this.placa);
  }

  validarAnio() {
    const anioActual = new Date().getFullYear();
    return this.anio >= 1950 && this.anio <= anioActual + 1;
  }

  validarTipo() {
    return Vehiculo.TIPOS_VALIDOS.includes(this.tipo);
  }

  esValido() {
    return (
      this.placa &&
      this.marca_id &&
      this.modelo &&
      this.anio &&
      this.tipo &&
      this.cliente_id &&
      this.validarPlaca() &&
      this.validarAnio() &&
      this.validarTipo()
    );
  }

  actualizarDatos(datos) {
    if (datos.placa) this.placa = datos.placa;
    if (datos.marca_id) this.marca_id = datos.marca_id;
    if (datos.modelo) this.modelo = datos.modelo;
    if (datos.anio) this.anio = datos.anio;
    if (datos.color) this.color = datos.color;
    if (datos.tipo) this.tipo = datos.tipo;
    if (datos.cliente_id) this.cliente_id = datos.cliente_id;
  }

  toJSON() {
    return {
      id: this.id,
      placa: this.placa,
      marca_id: this.marca_id,
      marca: this.marca,
      modelo: this.modelo,
      anio: this.anio,
      color: this.color,
      tipo: this.tipo,
      cliente_id: this.cliente_id,
      descripcion: this.descripcion,
      fecha_registro: this.fecha_registro
    };
  }

  toDatabase() {
    return {
      id: this.id,
      placa: this.placa,
      marca_id: this.marca_id,
      modelo: this.modelo,
      anio: this.anio,
      color: this.color,
      tipo: this.tipo,
      cliente_id: this.cliente_id,
      fecha_registro: this.fecha_registro
    };
  }

  static fromDatabase(data) {
    return new Vehiculo({
      id: data.id,
      placa: data.placa,
      marca_id: data.marca_id,
      marca: data.marca,
      modelo: data.modelo,
      anio: data.anio,
      color: data.color,
      tipo: data.tipo,
      cliente_id: data.cliente_id,
      fecha_registro: data.fecha_registro
    });
  }

  static forRegistration(data) {
    return new Vehiculo({
      placa: data.placa,
      marca_id: data.marca_id,
      modelo: data.modelo,
      anio: data.anio,
      color: data.color,
      tipo: data.tipo,
      cliente_id: data.cliente_id
    });
  }
};

module.exports = Vehiculo;