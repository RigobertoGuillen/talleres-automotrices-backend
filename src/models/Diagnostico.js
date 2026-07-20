const Diagnostico = class Diagnostico {
  constructor({
    id,
    orden_id,
    descripcion_falla,
    observaciones,
    recomendaciones,
    estado,
    mecanico_id,
    mecanico,
    fecha_registro,
    fecha_actualizacion
  } = {}) {
    this.id = id;
    this.orden_id = orden_id;
    this.descripcion_falla = descripcion_falla;
    this.observaciones = observaciones;
    this.recomendaciones = recomendaciones;
    this.estado = estado || 'pendiente';
    this.mecanico_id = mecanico_id;
    this.mecanico = mecanico;
    this.fecha_registro = fecha_registro || new Date();
    this.fecha_actualizacion = fecha_actualizacion || new Date();
  }

  static get ESTADOS_VALIDOS() {
    return ['pendiente', 'en proceso', 'completado'];
  }

  get esta_pendiente() {
    return this.estado === 'pendiente';
  }

  get esta_en_proceso() {
    return this.estado === 'en proceso';
  }

  get esta_completado() {
    return this.estado === 'completado';
  }

  get tiene_observaciones() {
    return !!this.observaciones && this.observaciones.trim().length > 0;
  }

  get tiene_recomendaciones() {
    return !!this.recomendaciones && this.recomendaciones.trim().length > 0;
  }

  cambiarEstado(nuevoEstado) {
    if (!Diagnostico.ESTADOS_VALIDOS.includes(nuevoEstado)) {
      throw new Error(`Estado inválido. Estados válidos: ${Diagnostico.ESTADOS_VALIDOS.join(', ')}`);
    }

    const estadoAnterior = this.estado;
    this.estado = nuevoEstado;
    this.fecha_actualizacion = new Date();

    return {
      estadoAnterior,
      estadoNuevo: nuevoEstado
    };
  }

  agregarObservaciones(observaciones) {
    if (!observaciones || !observaciones.trim()) {
      throw new Error('Las observaciones no pueden estar vacías');
    }
    this.observaciones = observaciones.trim();
    this.fecha_actualizacion = new Date();
  }

  agregarRecomendaciones(recomendaciones) {
    if (recomendaciones && recomendaciones.trim()) {
      this.recomendaciones = recomendaciones.trim();
      this.fecha_actualizacion = new Date();
    }
  }

  asignarMecanico(mecanico_id) {
    this.mecanico_id = mecanico_id;
    this.fecha_actualizacion = new Date();
  }

  estaCompleto() {
    return this.estado === 'completado' && this.descripcion_falla && this.descripcion_falla.trim().length > 0;
  }

  toJSON() {
    return {
      id: this.id,
      orden_id: this.orden_id,
      descripcion_falla: this.descripcion_falla,
      observaciones: this.observaciones,
      recomendaciones: this.recomendaciones,
      estado: this.estado,
      mecanico_id: this.mecanico_id,
      mecanico: this.mecanico,
      fecha_registro: this.fecha_registro,
      fecha_actualizacion: this.fecha_actualizacion
    };
  }

  toDatabase() {
    return {
      id: this.id,
      orden_id: this.orden_id,
      descripcion_falla: this.descripcion_falla,
      observaciones: this.observaciones,
      recomendaciones: this.recomendaciones,
      estado: this.estado,
      mecanico_id: this.mecanico_id,
      fecha_registro: this.fecha_registro,
      fecha_actualizacion: this.fecha_actualizacion
    };
  }

  static fromDatabase(data) {
    return new Diagnostico({
      id: data.id,
      orden_id: data.orden_id,
      descripcion_falla: data.descripcion_falla,
      observaciones: data.observaciones,
      recomendaciones: data.recomendaciones,
      estado: data.estado,
      mecanico_id: data.mecanico_id,
      mecanico: data.mecanico,
      fecha_registro: data.fecha_registro,
      fecha_actualizacion: data.fecha_actualizacion
    });
  }

  static forCreation(data) {
    return new Diagnostico({
      orden_id: data.orden_id,
      descripcion_falla: data.descripcion_falla,
      observaciones: data.observaciones || null,
      recomendaciones: data.recomendaciones || null,
      estado: data.estado || 'pendiente',
      mecanico_id: data.mecanico_id || null
    });
  }
};

module.exports = Diagnostico;