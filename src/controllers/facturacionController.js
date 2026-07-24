const FacturacionService = require('../services/facturacion.service');

// SRP: el controller solo traduce HTTP <-> FacturacionService (recibe
// request, llama al service, devuelve response); no contiene reglas de
// negocio ni SQL.
const getCais = async (req, res) => {
  try {
    const result = await FacturacionService.caiGetAll();
    res.json(result);
  } catch (error) {
    console.error('Error en getCais:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las autorizaciones CAI' });
  }
};

const getCaiActivo = async (req, res) => {
  try {
    const result = await FacturacionService.caiGetActivo();
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en getCaiActivo:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el CAI activo' });
  }
};

const createCai = async (req, res) => {
  try {
    const result = await FacturacionService.caiCreate(req.body);
    if (!result.success) {
      const status = result.message.includes('obligatorio') ||
                     result.message.includes('formato') ||
                     result.message.includes('rango') ||
                     result.message.includes('existe') ? 400 : 500;
      return res.status(status).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en createCai:', error);
    res.status(500).json({ success: false, message: 'Error al registrar la autorización CAI' });
  }
};

const getFacturaPreview = async (req, res) => {
  try {
    const { ordenId } = req.params;
    const result = await FacturacionService.facturaPreview(ordenId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en getFacturaPreview:', error);
    res.status(500).json({ success: false, message: 'Error al generar la vista previa de la factura' });
  }
};

const generarFactura = async (req, res) => {
  try {
    const { ordenId } = req.params;
    const result = await FacturacionService.facturaGenerar(ordenId);
    if (!result.success) {
      const status = result.message.includes('no encontrada') ? 404
        : result.message.includes('debe estar') ||
          result.message.includes('ya tiene') ||
          result.message.includes('No hay un CAI') ||
          result.message.includes('folios') ? 400
        : 500;
      return res.status(status).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en generarFactura:', error);
    res.status(500).json({ success: false, message: 'Error al generar la factura' });
  }
};

const getFacturas = async (req, res) => {
  try {
    const result = await FacturacionService.facturaGetAll();
    res.json(result);
  } catch (error) {
    console.error('Error en getFacturas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las facturas' });
  }
};

const getFacturaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await FacturacionService.facturaGetById(id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    console.error('Error en getFacturaById:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la factura' });
  }
};

const registrarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo_pago } = req.body;
    const result = await FacturacionService.facturaRegistrarPago(id, metodo_pago);
    if (!result.success) {
      const status = result.message.includes('no encontrada') ? 404
        : result.message.includes('inválido') ? 400
        : 500;
      return res.status(status).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error en registrarPago:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el pago' });
  }
};

module.exports = {
  getCais,
  getCaiActivo,
  createCai,
  getFacturaPreview,
  generarFactura,
  getFacturas,
  getFacturaById,
  registrarPago
};
