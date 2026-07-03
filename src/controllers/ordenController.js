const OrdenTrabajo = require('../models/OrdenTrabajo');

const createOrden = async (req, res) => {
  try {
    const { vehiculo_id, descripcion_problema, prioridad } = req.body;

    if (!vehiculo_id || !descripcion_problema) {
      return res.status(400).json({
        success: false,
        message: 'Vehículo y descripción del problema son obligatorios'
      });
    }

    const orden = await OrdenTrabajo.create({
      vehiculo_id,
      descripcion_problema,
      prioridad: prioridad || 0
    });

    res.status(201).json({
      success: true,
      message: 'Orden de trabajo creada correctamente',
      data: orden
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden de trabajo'
    });
  }
};

const getOrdenById = async (req, res) => {
  try {
    const { id } = req.params;
    const orden = await OrdenTrabajo.findById(id);

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({ success: true, data: orden });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden'
    });
  }
};

const getOrdenes = async (req, res) => {
  try {
    const { estado, mecanico_id, cliente_id, fecha_inicio, fecha_fin } = req.query;

    const ordenes = await OrdenTrabajo.findAll({
      estado,
      mecanico_id,
      cliente_id,
      fecha_inicio,
      fecha_fin
    });

    res.json({ success: true, data: ordenes });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes'
    });
  }
};

const asignarMecanico = async (req, res) => {
  try {
    const { id } = req.params;
    const { mecanico_id } = req.body;

    if (!mecanico_id) {
      return res.status(400).json({
        success: false,
        message: 'Mecánico es obligatorio'
      });
    }

    const orden = await OrdenTrabajo.asignarMecanico(id, mecanico_id);

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Mecánico asignado correctamente',
      data: orden
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar mecánico'
    });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    const estadosValidos = ['recibido', 'en reparacion', 'listo', 'entregado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Estados válidos: recibido, en reparacion, listo, entregado'
      });
    }

    const usuario_id = req.usuario.id;
    const orden = await OrdenTrabajo.actualizarEstado(id, estado, notas, usuario_id);

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      data: orden
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado'
    });
  }
};

const cerrarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const orden = await OrdenTrabajo.cerrar(id, usuario_id);

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada o ya está cerrada'
      });
    }

    res.json({
      success: true,
      message: 'Orden cerrada correctamente',
      data: orden
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar orden'
    });
  }
};

const getOrdenesByMecanico = async (req, res) => {
  try {
    const { id } = req.params;
    const ordenes = await OrdenTrabajo.findByMecanico(id);

    res.json({ success: true, data: ordenes });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes del mecánico'
    });
  }
};

const reasignarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const { mecanico_id } = req.body;

    if (!mecanico_id) {
      return res.status(400).json({
        success: false,
        message: 'Mecánico es obligatorio'
      });
    }

    const usuario_id = req.usuario.id;
    const orden = await OrdenTrabajo.reasignar(id, mecanico_id, usuario_id);

    if (!orden) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Orden reasignada correctamente',
      data: orden
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reasignar orden'
    });
  }
};

module.exports = {
  createOrden,
  getOrdenById,
  getOrdenes,
  asignarMecanico,
  actualizarEstado,
  cerrarOrden,
  getOrdenesByMecanico,
  reasignarOrden
};