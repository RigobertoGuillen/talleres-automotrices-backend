const OrdenTrabajo = class OrdenTrabajo {
  constructor({
    id,
    numero_orden,
    vehiculo_id,
    mecanico_id,
    fecha_ingreso,
    descripcion_problema,
    estado,
    prioridad,
    fecha_creacion,
    fecha_actualizacion,
    placa,
    modelo,
    marca,
    cliente_nombre,
    cliente_id,
    mecanico_nombre,
    diagnosticos = [],
    historial_estados = []
  } = {}) {
    this.id = id;
    this.numero_orden = numero_orden;
    this.vehiculo_id = vehiculo_id;
    this.mecanico_id = mecanico_id;
    this.fecha_ingreso = fecha_ingreso || new Date();
    this.descripcion_problema = descripcion_problema;
    this.estado = estado || 'recibido';
    this.prioridad = prioridad || 0;
    this.fecha_creacion = fecha_creacion || new Date();
    this.fecha_actualizacion = fecha_actualizacion || new Date();
    this.placa = placa;
    this.modelo = modelo;
    this.marca = marca;
    this.cliente_nombre = cliente_nombre;
    this.cliente_id = cliente_id;
    this.mecanico_nombre = mecanico_nombre;
    this.diagnosticos = diagnosticos;
    this.historial_estados = historial_estados;
  }

  static get ESTADOS_VALIDOS() {
    return ['recibido', 'en reparacion', 'listo', 'entregado'];
  }

  get esta_abierta() {
    return this.estado !== 'entregado';
  }

  get esta_en_reparacion() {
    return this.estado === 'en reparacion';
  }

  get esta_lista() {
    return this.estado === 'listo';
  }

  get esta_entregada() {
    return this.estado === 'entregado';
  }

  get es_prioritaria() {
    return this.prioridad >= 2;
  }

  get es_urgente() {
    return this.prioridad >= 3;
  }

  cambiarEstado(nuevoEstado, notas = null, usuario_id = null) {
    if (!OrdenTrabajo.ESTADOS_VALIDOS.includes(nuevoEstado)) {
      throw new Error(`Estado inválido. Estados válidos: ${OrdenTrabajo.ESTADOS_VALIDOS.join(', ')}`);
    }

    const estadoAnterior = this.estado;
    this.estado = nuevoEstado;
    this.fecha_actualizacion = new Date();
    this._agregarHistorial(nuevoEstado, notas, usuario_id);

    return {
      estadoAnterior,
      estadoNuevo: nuevoEstado,
      notas,
      usuario_id,
      fecha: new Date()
    };
  }

  asignarMecanico(mecanico_id, usuario_id = null) {
    if (this.estado === 'entregado') {
      throw new Error('No se puede asignar un mecánico a una orden ya entregada');
    }

    const mecanicoAnterior = this.mecanico_id;
    this.mecanico_id = mecanico_id;
    this.fecha_actualizacion = new Date();

    this._agregarHistorial(
      this.estado,
      `Mecánico asignado: ${mecanicoAnterior ? `anterior: ${mecanicoAnterior} → nuevo: ${mecanico_id}` : `ID: ${mecanico_id}`}`,
      usuario_id
    );

    return {
      mecanicoAnterior,
      mecanicoNuevo: mecanico_id
    };
  }

  agregarDiagnostico(diagnostico) {
    this.diagnosticos.push(diagnostico);
    this.fecha_actualizacion = new Date();
  }

  marcarComoListo(notas = null, usuario_id = null) {
    if (this.estado === 'entregado') {
      throw new Error('La orden ya está entregada');
    }
    return this.cambiarEstado('listo', notas, usuario_id);
  }

  marcarComoEntregada(notas = null, usuario_id = null) {
    if (this.estado === 'entregado') {
      throw new Error('La orden ya está entregada');
    }
    return this.cambiarEstado('entregado', notas || 'Orden completada', usuario_id);
  }

  reabrir(notas = null, usuario_id = null) {
    if (this.estado !== 'entregado') {
      throw new Error('Solo se pueden reabrir órdenes entregadas');
    }
    return this.cambiarEstado('en reparacion', notas || 'Orden reabierta', usuario_id);
  }

  _agregarHistorial(estado, notas, usuario_id) {
    this.historial_estados.push({
      estado,
      notas,
      usuario_id: usuario_id,
      fecha_hora: new Date()
    });
  }

  toJSON() {
    return {
      id: this.id,
      numero_orden: this.numero_orden,
      vehiculo_id: this.vehiculo_id,
      mecanico_id: this.mecanico_id,
      fecha_ingreso: this.fecha_ingreso,
      descripcion_problema: this.descripcion_problema,
      estado: this.estado,
      prioridad: this.prioridad,
      fecha_creacion: this.fecha_creacion,
      fecha_actualizacion: this.fecha_actualizacion,
      placa: this.placa,
      modelo: this.modelo,
      marca: this.marca,
      cliente_nombre: this.cliente_nombre,
      cliente_id: this.cliente_id,
      mecanico_nombre: this.mecanico_nombre,
      diagnosticos: this.diagnosticos,
      historial_estados: this.historial_estados,
      esta_abierta: this.esta_abierta,
      es_prioritaria: this.es_prioritaria
    };
  }

  toDatabase() {
    return {
      id: this.id,
      numero_orden: this.numero_orden,
      vehiculo_id: this.vehiculo_id,
      mecanico_id: this.mecanico_id,
      fecha_ingreso: this.fecha_ingreso,
      descripcion_problema: this.descripcion_problema,
      estado: this.estado,
      prioridad: this.prioridad,
      fecha_creacion: this.fecha_creacion,
      fecha_actualizacion: this.fecha_actualizacion
    };
  }

  static fromDatabase(data) {
    return new OrdenTrabajo({
      id: data.id,
      numero_orden: data.numero_orden,
      vehiculo_id: data.vehiculo_id,
      mecanico_id: data.mecanico_id,
      fecha_ingreso: data.fecha_ingreso,
      descripcion_problema: data.descripcion_problema,
      estado: data.estado,
      prioridad: data.prioridad,
      fecha_creacion: data.fecha_creacion,
      fecha_actualizacion: data.fecha_actualizacion,
      placa: data.placa,
      modelo: data.modelo,
      marca: data.marca,
      cliente_nombre: data.cliente_nombre,
      cliente_id: data.cliente_id,
      mecanico_nombre: data.mecanico_nombre,
      diagnosticos: data.diagnosticos || [],
      historial_estados: data.historial_estados || []
    });
  }

  static forCreation(data) {
    return new OrdenTrabajo({
      vehiculo_id: data.vehiculo_id,
      descripcion_problema: data.descripcion_problema,
      prioridad: data.prioridad || 0,
      estado: 'recibido'
    });
  }
};

module.exports = OrdenTrabajo;