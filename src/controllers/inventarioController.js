const InventarioService = require('../services/inventario.service');

const getCategorias = async (req, res) => {
  try {
    const result = await InventarioService.categoriaGetAll();
    res.json(result);
  } catch (error) {
    console.error('Error en getCategorias:', error);
    res.status(500).json({ success: false, message: 'Error al obtener categorías' });
  }
};

const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InventarioService.categoriaGetById(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en getCategoriaById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener categoría' });
  }
};

const createCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }
    const result = await InventarioService.categoriaCreate({ nombre: nombre.trim() });
    if (!result.success) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en createCategoria:', error);
    res.status(500).json({ success: false, message: 'Error al crear categoría' });
  }
};

const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }
    const result = await InventarioService.categoriaUpdate(id, { nombre: nombre.trim() });
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en updateCategoria:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar categoría' });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InventarioService.categoriaDelete(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en deleteCategoria:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar categoría' });
  }
};

const getRepuestos = async (req, res) => {
  try {
    const result = await InventarioService.repuestoGetAll();
    res.json(result);
  } catch (error) {
    console.error('Error en getRepuestos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener repuestos' });
  }
};

const getRepuestoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InventarioService.repuestoGetById(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en getRepuestoById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener repuesto' });
  }
};

const buscarRepuestos = async (req, res) => {
  try {
    const { q } = req.query;
    const result = await InventarioService.repuestoBuscar(q);
    res.json(result);
  } catch (error) {
    console.error('Error en buscarRepuestos:', error);
    res.status(500).json({ success: false, message: 'Error al buscar repuestos' });
  }
};

const crearRepuestoCompleto = async (req, res) => {
  try {
    const result = await InventarioService.repuestoCreateCompleto({
      ...req.body,
      usuario_id: req.usuario.id
    });
    if (!result.success) {
      const status = result.message.includes('obligatorio') || result.message.includes('existe') ? 400 : 500;
      return res.status(status).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en crearRepuestoCompleto:', error);
    res.status(500).json({ success: false, message: 'Error al registrar repuesto' });
  }
};

const updateRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InventarioService.repuestoUpdate(id, req.body);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en updateRepuesto:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar repuesto' });
  }
};

const deleteRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InventarioService.repuestoDelete(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en deleteRepuesto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar repuesto' });
  }
};

const consultarStock = async (req, res) => {
  try {
    const { repuesto_id, nombre, codigo, categoria_id, solo_bajo_stock } = req.query;
    const result = await InventarioService.stockConsultar({
      repuesto_id, nombre, codigo, categoria_id, solo_bajo_stock
    });
    res.json(result);
  } catch (error) {
    console.error('Error en consultarStock:', error);
    res.status(500).json({ success: false, message: 'Error al consultar stock' });
  }
};

const getAlertasStock = async (req, res) => {
  try {
    const result = await InventarioService.stockAlertas();
    res.json(result);
  } catch (error) {
    console.error('Error en getAlertasStock:', error);
    res.status(500).json({ success: false, message: 'Error al obtener alertas' });
  }
};

const crearMovimiento = async (req, res) => {
  try {
    const result = await InventarioService.movimientoCreate({
      ...req.body,
      usuario_id: req.usuario.id
    });
    if (!result.success) {
      const status = result.message.includes('obligatorio') || 
                     result.message.includes('inválido') || 
                     result.message.includes('insuficiente') ? 400 : 500;
      return res.status(status).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en crearMovimiento:', error);
    res.status(500).json({ success: false, message: 'Error al registrar movimiento' });
  }
};

const getMovimientos = async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const result = await InventarioService.movimientoGetAll(limit, offset);
    res.json(result);
  } catch (error) {
    console.error('Error en getMovimientos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos' });
  }
};

const getMovimientosByRepuesto = async (req, res) => {
  try {
    const { repuestoId } = req.params;
    const result = await InventarioService.movimientoGetByRepuesto(repuestoId);
    res.json(result);
  } catch (error) {
    console.error('Error en getMovimientosByRepuesto:', error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos del repuesto' });
  }
};

const crearSolicitud = async (req, res) => {
  try {
    const result = await InventarioService.solicitudCreate({
      ...req.body,
      mecanico_id: req.usuario.id
    });
    if (!result.success) {
      const status = result.message.includes('obligatoria') || 
                     result.message.includes('obligatorio') || 
                     result.message.includes('insuficiente') ? 400 : 500;
      return res.status(status).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en crearSolicitud:', error);
    res.status(500).json({ success: false, message: 'Error al crear solicitud' });
  }
};

const aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const result = await InventarioService.solicitudAprobar(id, estado, req.usuario.id);
    if (!result.success) {
      const status = result.message.includes('inválido') || 
                     result.message.includes('encontrada') ||
                     result.message.includes('insuficiente') ? 400 : 500;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error en aprobarSolicitud:', error);
    res.status(500).json({ success: false, message: 'Error al procesar solicitud' });
  }
};

const getSolicitudesPendientes = async (req, res) => {
  try {
    const result = await InventarioService.solicitudGetPendientes();
    res.json(result);
  } catch (error) {
    console.error('Error en getSolicitudesPendientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener solicitudes pendientes' });
  }
};

const getSolicitudesByOrden = async (req, res) => {
  try {
    const { ordenId } = req.params;
    const result = await InventarioService.solicitudGetByOrden(ordenId);
    res.json(result);
  } catch (error) {
    console.error('Error en getSolicitudesByOrden:', error);
    res.status(500).json({ success: false, message: 'Error al obtener solicitudes de la orden' });
  }
};

const getSolicitudes = async (req, res) => {
  try {
    const result = await InventarioService.solicitudGetAll();
    res.json(result);
  } catch (error) {
    console.error('Error en getSolicitudes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener solicitudes' });
  }
};

module.exports = {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getRepuestos,
  getRepuestoById,
  buscarRepuestos,
  crearRepuestoCompleto,
  updateRepuesto,
  deleteRepuesto,
  consultarStock,
  getAlertasStock,
  crearMovimiento,
  getMovimientos,
  getMovimientosByRepuesto,
  crearSolicitud,
  aprobarSolicitud,
  getSolicitudesPendientes,
  getSolicitudesByOrden,
  getSolicitudes
};