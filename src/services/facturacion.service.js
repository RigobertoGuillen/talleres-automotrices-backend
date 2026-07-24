const BaseService = require('./base.service');
const FacturacionRepository = require('../repositories/facturacion.repository');

const METODOS_PAGO_VALIDOS = ['efectivo', 'tarjeta', 'transferencia'];

// DIP: FacturacionService depende de la abstracción BaseService/repository
// (inyectado en el constructor), no de una implementación concreta de base
// de datos.
// SRP: aquí solo viven las reglas de negocio de CAI y facturación
// (validaciones, cálculo del siguiente número de factura); la consulta
// cruda vive en el repository y la traducción a HTTP en el controller.
//
// Nota: la base de datos ya tiene un trigger (fn_generar_factura_al_entregar)
// que autogenera la factura cuando una orden pasa a 'entregado'. Este
// service replica la MISMA lógica (mismo CAI activo/vigente, mismo cálculo
// de correlativo) pero como una acción explícita de dos pasos —
// facturaPreview (ver detalle) y facturaGenerar (confirmar) — para los
// casos en que el trigger no alcanzó a correr (ej. ordenes ya entregadas
// antes de tener CAI cargado) o cuando el staff quiere revisar el detalle
// antes de emitir. El propio trigger trg_validar_factura_cai vuelve a
// validar el rango/vigencia al insertar, como red de seguridad adicional.
class FacturacionService extends BaseService {
  constructor() {
    super(FacturacionRepository);
  }

  // ── CAI ────────────────────────────────────────────────────────────
  async caiGetAll() {
    try {
      const cais = await this.repository.caiFindAll();
      return { success: true, data: cais };
    } catch (error) {
      console.error('Error en caiGetAll:', error.message);
      return { success: false, message: 'Error al obtener las autorizaciones CAI' };
    }
  }

  async caiGetActivo() {
    try {
      const cai = await this.repository.caiFindActivoVigente();
      if (!cai) {
        return { success: false, message: 'No hay un CAI activo y vigente en este momento' };
      }
      return { success: true, data: cai };
    } catch (error) {
      console.error('Error en caiGetActivo:', error.message);
      return { success: false, message: 'Error al obtener el CAI activo' };
    }
  }

  async caiCreate(data) {
    try {
      const { cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin, fecha_limite_emision } = data;

      if (!cai || !punto_emision || !rango_autorizado_inicio || !rango_autorizado_fin || !fecha_limite_emision) {
        return { success: false, message: 'Todos los campos del CAI son obligatorios' };
      }

      const patronCai = /^[0-9A-Z]{6}(-[0-9A-Z]{6}){5}-[0-9A-Z]{2}$/;
      if (!patronCai.test(cai)) {
        return { success: false, message: 'El código CAI no tiene el formato esperado (7 grupos separados por guion)' };
      }

      const patronRango = /^\d{3}-\d{3}-\d{2}-\d{8}$/;
      if (!patronRango.test(rango_autorizado_inicio) || !patronRango.test(rango_autorizado_fin)) {
        return { success: false, message: 'El rango autorizado debe tener el formato 000-000-00-00000000' };
      }
      if (rango_autorizado_fin <= rango_autorizado_inicio) {
        return { success: false, message: 'El rango final debe ser mayor que el rango inicial' };
      }

      const patronPunto = /^\d{3}-\d{3}-\d{2}$/;
      if (!patronPunto.test(punto_emision)) {
        return { success: false, message: 'El punto de emisión debe tener el formato 000-000-00' };
      }

      const existe = await this.repository.caiFindByCodigo(cai);
      if (existe) {
        return { success: false, message: 'Ya existe una autorización con este código CAI' };
      }

      const nuevoCai = await this.repository.caiCreate({
        cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin, fecha_limite_emision
      });

      return { success: true, message: 'Autorización CAI registrada correctamente', data: nuevoCai };
    } catch (error) {
      console.error('Error en caiCreate:', error.message);
      return { success: false, message: error.message || 'Error al registrar la autorización CAI' };
    }
  }

  // ── Detalle / generación de factura ────────────────────────────────
  async facturaPreview(ordenId) {
    try {
      const orden = await this.repository.ordenFindParaFactura(ordenId);
      if (!orden) {
        return { success: false, message: 'Orden no encontrada' };
      }

      const existente = await this.repository.facturaFindByOrden(ordenId);
      if (existente) {
        const detalle = await this.repository.facturaDetalleFindByFactura(existente.id);
        return {
          success: true,
          data: { yaFacturada: true, factura: existente, detalle }
        };
      }

      const servicios = await this.repository.ordenServiciosParaFacturar(ordenId);
      const repuestos = await this.repository.ordenRepuestosParaFacturar(ordenId);

      const items = [
        ...servicios.map(s => ({ tipo: 'servicio', ...s })),
        ...repuestos.map(r => ({ tipo: 'repuesto', ...r }))
      ];

      const subtotal = items.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.costo_unitario)), 0);
      const isv15 = Math.round(subtotal * 0.15 * 100) / 100;
      const total = Math.round((subtotal + isv15) * 100) / 100;

      return {
        success: true,
        data: {
          yaFacturada: false,
          orden,
          items,
          subtotal_gravado_15: Math.round(subtotal * 100) / 100,
          isv_15: isv15,
          total
        }
      };
    } catch (error) {
      console.error('Error en facturaPreview:', error.message);
      return { success: false, message: error.message || 'Error al generar la vista previa de la factura' };
    }
  }

  // Calcula el siguiente número de factura dentro del rango del CAI,
  // exactamente igual que fn_generar_factura_al_entregar en la base de datos.
  _calcularSiguienteNumero(cai, ultimoNumero) {
    if (!ultimoNumero) return cai.rango_autorizado_inicio;
    const correlativo = parseInt(ultimoNumero.slice(11), 10) + 1;
    return ultimoNumero.slice(0, 11) + String(correlativo).padStart(8, '0');
  }

  async facturaGenerar(ordenId) {
    try {
      const orden = await this.repository.ordenFindParaFactura(ordenId);
      if (!orden) {
        return { success: false, message: 'Orden no encontrada' };
      }
      if (orden.estado !== 'entregado') {
        return { success: false, message: "La orden debe estar en estado 'entregado' para poder facturarse" };
      }

      const existente = await this.repository.facturaFindByOrden(ordenId);
      if (existente) {
        return { success: false, message: 'Esta orden ya tiene una factura generada' };
      }

      const cai = await this.repository.caiFindActivoVigente();
      if (!cai) {
        return { success: false, message: 'No hay un CAI activo y vigente para facturar' };
      }

      const ultimoNumero = await this.repository.caiFindUltimoNumero(cai.id);
      const nuevoNumero = this._calcularSiguienteNumero(cai, ultimoNumero);
      if (nuevoNumero > cai.rango_autorizado_fin) {
        return { success: false, message: `El CAI ${cai.cai} se quedó sin folios disponibles (rango agotado)` };
      }

      const factura = await this.repository.facturaCreate({
        orden_id: orden.numero_orden,
        cai_id: cai.id,
        numero_factura: nuevoNumero,
        cliente_dni: orden.cliente_dni,
        cliente_nombre: orden.cliente_nombre,
        cliente_direccion: orden.cliente_direccion
      });

      const servicios = await this.repository.ordenServiciosParaFacturar(ordenId);
      for (const s of servicios) {
        await this.repository.facturaDetalleInsertServicio(factura.id, s);
      }

      const repuestos = await this.repository.ordenRepuestosParaFacturar(ordenId);
      for (const r of repuestos) {
        await this.repository.facturaDetalleInsertRepuesto(factura.id, r);
      }

      // Se vuelve a leer la factura porque el trigger de la base de datos
      // recalcula subtotal_gravado_15/isv_15/total al insertar el detalle.
      const facturaFinal = await this.repository.facturaFindById(factura.id);
      const detalle = await this.repository.facturaDetalleFindByFactura(factura.id);

      return {
        success: true,
        message: 'Factura generada correctamente',
        data: { factura: facturaFinal, detalle }
      };
    } catch (error) {
      console.error('Error en facturaGenerar:', error.message);
      return { success: false, message: error.message || 'Error al generar la factura' };
    }
  }

  // ── Consulta de facturas ya generadas ────────────────────────────────
  async facturaGetAll() {
    try {
      const facturas = await this.repository.facturaFindAll();
      return { success: true, data: facturas };
    } catch (error) {
      console.error('Error en facturaGetAll:', error.message);
      return { success: false, message: 'Error al obtener las facturas' };
    }
  }

  async facturaGetById(id) {
    try {
      const factura = await this.repository.facturaFindById(id);
      if (!factura) {
        return { success: false, message: 'Factura no encontrada' };
      }
      const detalle = await this.repository.facturaDetalleFindByFactura(id);
      return { success: true, data: { factura, detalle } };
    } catch (error) {
      console.error('Error en facturaGetById:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Registrar el método de pago al momento del cobro. La factura se genera
  // con metodo_pago NULL (aún no se ha cobrado); esto lo completa después,
  // tal como documenta el esquema de la base de datos.
  async facturaRegistrarPago(id, metodoPago) {
    try {
      if (!metodoPago || !METODOS_PAGO_VALIDOS.includes(metodoPago)) {
        return { success: false, message: `Método de pago inválido. Debe ser uno de: ${METODOS_PAGO_VALIDOS.join(', ')}` };
      }

      const factura = await this.repository.facturaFindById(id);
      if (!factura) {
        return { success: false, message: 'Factura no encontrada' };
      }

      const facturaActualizada = await this.repository.facturaUpdateMetodoPago(id, metodoPago);
      return { success: true, message: 'Pago registrado correctamente', data: facturaActualizada };
    } catch (error) {
      console.error('Error en facturaRegistrarPago:', error.message);
      return { success: false, message: error.message || 'Error al registrar el pago' };
    }
  }
}

module.exports = new FacturacionService();
