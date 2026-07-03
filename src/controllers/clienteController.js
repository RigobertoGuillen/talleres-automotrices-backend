const Cliente = require('../models/Cliente');
const pool = require('../config/db');

const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll();

    res.json({
      success: true,
      data: clientes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes'
    });
  }
};

const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findById(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente'
    });
  }
};

const buscarClientes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar un término de búsqueda'
      });
    }

    const clientes = await Cliente.findByNombre(q);

    res.json({
      success: true,
      data: clientes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar clientes'
    });
  }
};

const createCliente = async (req, res) => {
  try {

    const {
      nombre,
      telefono,
      correo,
      direccion
    } = req.body;

    if (!nombre || !telefono) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y teléfono son obligatorios'
      });
    }

    const cliente = await Cliente.create({
      nombre,
      telefono,
      correo,
      direccion
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      data: cliente
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente'
    });
  }
};

const updateCliente = async (req, res) => {
  try {

    const { id } = req.params;

    const cliente = await Cliente.findById(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    if (req.body.nombre && req.body.nombre !== cliente.nombre) {
      await Cliente.registrarAuditoria({
        cliente_id: id,
        campo_modificado: 'nombre',
        valor_anterior: cliente.nombre,
        valor_nuevo: req.body.nombre
      });
    }

    if (req.body.telefono && req.body.telefono !== cliente.telefono) {
      await Cliente.registrarAuditoria({
        cliente_id: id,
        campo_modificado: 'telefono',
        valor_anterior: cliente.telefono,
        valor_nuevo: req.body.telefono
      });
    }

    if (req.body.correo && req.body.correo !== cliente.correo) {
      await Cliente.registrarAuditoria({
        cliente_id: id,
        campo_modificado: 'correo',
        valor_anterior: cliente.correo,
        valor_nuevo: req.body.correo
      });
    }

    if (req.body.direccion && req.body.direccion !== cliente.direccion) {
      await Cliente.registrarAuditoria({
        cliente_id: id,
        campo_modificado: 'direccion',
        valor_anterior: cliente.direccion,
        valor_nuevo: req.body.direccion
      });
    }

    const actualizado = await Cliente.update(id, req.body);

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: actualizado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente'
    });
  }
};

const deleteCliente = async (req, res) => {
  try {

    const { id } = req.params;

    const cliente = await Cliente.findById(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    await Cliente.delete(id);

    res.json({
      success: true,
      message: 'Cliente eliminado correctamente'
    });

  } catch (error) {
    console.error(error);

    if (
      error.message ===
      'No se puede eliminar un cliente con órdenes de trabajo activas'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente'
    });
  }
};

const getHistorialCliente = async (req, res) => {
  try {

    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    const cliente = await Cliente.findById(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    let query = `
      SELECT
        o.*,
        v.placa,
        v.modelo,
        u.nombre_completo AS mecanico_nombre,
        d.descripcion_falla,
        d.observaciones AS diagnostico_observaciones
      FROM ordenes_trabajo o
      LEFT JOIN vehiculos v
        ON o.vehiculo_id = v.id
      LEFT JOIN usuarios u
        ON o.mecanico_id = u.id
      LEFT JOIN diagnosticos d
        ON o.id = d.orden_id
      WHERE v.cliente_id = $1
    `;

    const params = [id];
    let index = 2;

    if (fecha_inicio) {
      query += ` AND o.fecha_ingreso >= $${index++}`;
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      query += ` AND o.fecha_ingreso <= $${index++}`;
      params.push(fecha_fin);
    }

    query += ` ORDER BY o.fecha_ingreso DESC`;

    const historial = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        cliente,
        historial: historial.rows
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial'
    });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  buscarClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getHistorialCliente
};