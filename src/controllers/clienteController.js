const Cliente = require('../models/Cliente');
const pool = require('../config/db');

const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll();
    res.json({ success: true, data: clientes });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener clientes' });
  }
};

const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.json({ success: true, data: cliente });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener cliente' });
  }
};

const buscarClientes = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Se requiere un término de búsqueda' });
    }
    const clientes = await Cliente.findByNombre(q);
    res.json({ success: true, data: clientes });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al buscar clientes' });
  }
};

const getClienteByDni = async (req, res) => {
  try {
    const { dni } = req.params;
    const cliente = await Cliente.findByDni(dni);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.json({ success: true, data: cliente });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al buscar cliente' });
  }
};

const createCliente = async (req, res) => {
  try {
    const { dni, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo, direccion } = req.body;

    if (!dni || !primer_nombre || !primer_apellido || !telefono) {
      return res.status(400).json({ 
        success: false, 
        message: 'DNI, primer nombre, primer apellido y teléfono son obligatorios' 
      });
    }

    const existe = await Cliente.findByDni(dni);
    if (existe) {
      return res.status(400).json({ success: false, message: 'Ya existe un cliente con este DNI' });
    }

    const cliente = await Cliente.create({
      dni,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
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
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al crear cliente' });
  }
};

const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { dni, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, correo, direccion } = req.body;

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    if (dni && dni !== cliente.dni) {
      await Cliente.registrarAuditoria({
        cliente_id: id,
        campo_modificado: 'dni',
        valor_anterior: cliente.dni,
        valor_nuevo: dni
      });
    }
    if (telefono && telefono !== cliente.telefono) {
      await Cliente.registrarAuditoria({
        cliente_id: id,
        campo_modificado: 'telefono',
        valor_anterior: cliente.telefono,
        valor_nuevo: telefono
      });
    }
    if (correo && correo !== cliente.correo) {
      await Cliente.registrarAuditoria({
        cliente_id: id,
        campo_modificado: 'correo',
        valor_anterior: cliente.correo,
        valor_nuevo: correo
      });
    }

    const updated = await Cliente.update(id, {
      dni,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      telefono,
      correo,
      direccion
    });

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: updated
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar cliente' });
  }
};

const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    await Cliente.delete(id);

    res.json({ success: true, message: 'Cliente eliminado correctamente' });

  } catch (error) {
    console.error('Error:', error);
    if (error.message === 'No se puede eliminar un cliente con órdenes de trabajo asociadas') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Error al eliminar cliente' });
  }
};

const getHistorialCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    let query = `
      SELECT o.*, v.placa, v.modelo, 
             u.nombre_completo as mecanico_nombre,
             d.decripcion_falla, d.observaciones as diagnostico_observaciones
      FROM ordenes_trabajo o
      JOIN vehiculos v ON o.vehiculo_id = v.id
      LEFT JOIN usuarios u ON o.mecanico_id = u.id
      LEFT JOIN diagnosticos d ON o.id = d.orden_id
      WHERE v.cliente_id = $1
    `;

    const params = [id];
    let paramIndex = 2;

    if (fecha_inicio) {
      query += ` AND o.fecha_ingreso >= $${paramIndex++}`;
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      query += ` AND o.fecha_ingreso <= $${paramIndex++}`;
      params.push(fecha_fin);
    }

    query += ` ORDER BY o.fecha_ingreso DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        cliente: {
          id: cliente.id,
          nombre_completo: `${cliente.primer_nombre} ${cliente.primer_apellido}`,
          dni: cliente.dni,
          telefono: cliente.telefono,
          correo: cliente.correo
        },
        historial: result.rows
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener historial del cliente' });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  getClienteByDni,
  buscarClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getHistorialCliente
};