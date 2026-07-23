const BaseService = require('./base.service');
const InventarioRepository = require('../repositories/inventario.repository');

class InventarioService extends BaseService {
  constructor() {
    super(InventarioRepository);
  }

  async categoriaGetAll() {
    try {
      const categorias = await this.repository.categoriaFindAll();
      return { success: true, data: categorias };
    } catch (error) {
      console.error('Error en categoriaGetAll:', error.message);
      return { success: false, message: 'Error al obtener categorías' };
    }
  }

  async categoriaGetById(id) {
    try {
      const categoria = await this.repository.categoriaFindById(id);
      if (!categoria) {
        return { success: false, message: 'Categoría no encontrada' };
      }
      return { success: true, data: categoria };
    } catch (error) {
      console.error('Error en categoriaGetById:', error.message);
      return { success: false, message: error.message };
    }
  }

  async categoriaCreate(data) {
    try {
      if (!data.nombre || !data.nombre.trim()) {
        return { success: false, message: 'El nombre es obligatorio' };
      }
      const categoria = await this.repository.categoriaCreate({
        nombre: data.nombre.trim()
      });
      return { success: true, message: 'Categoría creada', data: categoria };
    } catch (error) {
      console.error('Error en categoriaCreate:', error.message);
      return { success: false, message: error.message || 'Error al crear categoría' };
    }
  }

  async categoriaUpdate(id, data) {
    try {
      const existe = await this.repository.categoriaFindById(id);
      if (!existe) {
        return { success: false, message: 'Categoría no encontrada' };
      }
      if (!data.nombre || !data.nombre.trim()) {
        return { success: false, message: 'El nombre es obligatorio' };
      }
      const categoria = await this.repository.categoriaUpdate(id, {
        nombre: data.nombre.trim()
      });
      return { success: true, message: 'Categoría actualizada', data: categoria };
    } catch (error) {
      console.error('Error en categoriaUpdate:', error.message);
      return { success: false, message: error.message || 'Error al actualizar categoría' };
    }
  }

  async categoriaDelete(id) {
    try {
      const existe = await this.repository.categoriaFindById(id);
      if (!existe) {
        return { success: false, message: 'Categoría no encontrada' };
      }
      const tieneRepuestos = await this.repository.categoriaCheckRepuestos(id);
      if (tieneRepuestos) {
        return { success: false, message: 'No se puede eliminar categoría con repuestos' };
      }
      await this.repository.categoriaDelete(id);
      return { success: true, message: 'Categoría eliminada' };
    } catch (error) {
      console.error('Error en categoriaDelete:', error.message);
      return { success: false, message: error.message || 'Error al eliminar categoría' };
    }
  }

  async repuestoGetAll() {
    try {
      const repuestos = await this.repository.repuestoFindAll();
      return { success: true, data: repuestos };
    } catch (error) {
      console.error('Error en repuestoGetAll:', error.message);
      return { success: false, message: 'Error al obtener repuestos' };
    }
  }

  async repuestoGetById(id) {
    try {
      const repuesto = await this.repository.repuestoFindById(id);
      if (!repuesto) {
        return { success: false, message: 'Repuesto no encontrado' };
      }
      return { success: true, data: repuesto };
    } catch (error) {
      console.error('Error en repuestoGetById:', error.message);
      return { success: false, message: error.message };
    }
  }

  async repuestoBuscar(query) {
    try {
      if (!query || !query.trim()) {
        return await this.repuestoGetAll();
      }
      const repuestos = await this.repository.repuestoBuscar(query.trim());
      return { success: true, data: repuestos };
    } catch (error) {
      console.error('Error en repuestoBuscar:', error.message);
      return { success: false, message: 'Error al buscar repuestos' };
    }
  }

  async repuestoCreateCompleto(data) {
    try {
      const { codigo, nombre, categoria_id, costo_unitario, precio_unitario, cantidad_inicial, cantidad_minima } = data;

      if (!codigo) return { success: false, message: 'El código es obligatorio' };
      if (!nombre) return { success: false, message: 'El nombre es obligatorio' };
      if (!categoria_id) return { success: false, message: 'La categoría es obligatoria' };
      if (!precio_unitario || precio_unitario < 0) {
        return { success: false, message: 'El precio debe ser mayor a 0' };
      }

      const existe = await this.repository.repuestoFindByCodigo(codigo.trim());
      if (existe) {
        return { success: false, message: 'Ya existe un repuesto con este código' };
      }

      const repuesto = await this.repository.repuestoCreate({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        categoria_id: parseInt(categoria_id),
        costo_unitario: parseFloat(costo_unitario) || 0,
        precio_unitario: parseFloat(precio_unitario)
      });

      const stock = await this.repository.stockCreate({
        repuesto_id: repuesto.id,
        cantidad_disponible: parseInt(cantidad_inicial) || 0,
        cantidad_minima: parseInt(cantidad_minima) || 0
      });

      if (parseInt(cantidad_inicial) > 0) {
        await this.movimientoCreate({
          repuesto_id: repuesto.id,
          tipo_movimiento: 'entrada',
          cantidad: parseInt(cantidad_inicial),
          motivo: 'Registro inicial de inventario',
          usuario_id: data.usuario_id
        });
      }

      return {
        success: true,
        message: 'Repuesto registrado correctamente',
        data: { repuesto, stock }
      };
    } catch (error) {
      console.error('Error en repuestoCreateCompleto:', error.message);
      return { success: false, message: error.message || 'Error al registrar repuesto' };
    }
  }

  async repuestoUpdate(id, data) {
    try {
      const existe = await this.repository.repuestoFindById(id);
      if (!existe) {
        return { success: false, message: 'Repuesto no encontrado' };
      }
      const repuesto = await this.repository.repuestoUpdate(id, data);
      return { success: true, message: 'Repuesto actualizado', data: repuesto };
    } catch (error) {
      console.error('Error en repuestoUpdate:', error.message);
      return { success: false, message: error.message || 'Error al actualizar repuesto' };
    }
  }

  async repuestoDelete(id) {
    try {
      const existe = await this.repository.repuestoFindById(id);
      if (!existe) {
        return { success: false, message: 'Repuesto no encontrado' };
      }
      const tieneMovimientos = await this.repository.repuestoCheckMovimientos(id);
      if (tieneMovimientos) {
        return { success: false, message: 'No se puede eliminar repuesto con movimientos' };
      }
      await this.repository.repuestoDelete(id);
      return { success: true, message: 'Repuesto eliminado' };
    } catch (error) {
      console.error('Error en repuestoDelete:', error.message);
      return { success: false, message: error.message || 'Error al eliminar repuesto' };
    }
  }

  async stockConsultar(filtros = {}) {
    try {
      const { repuesto_id, nombre, codigo, categoria_id, solo_bajo_stock } = filtros;

      if (repuesto_id) {
        const repuesto = await this.repository.repuestoFindById(parseInt(repuesto_id));
        if (!repuesto) {
          return { success: false, message: 'Repuesto no encontrado' };
        }
        const stock = await this.repository.stockFindByRepuesto(parseInt(repuesto_id));
        return {
          success: true,
          data: { ...repuesto, stock: stock || { cantidad_disponible: 0, cantidad_minima: 0 } }
        };
      }

      if (solo_bajo_stock === 'true') {
        const alertas = await this.repository.stockGetBajo();
        return { success: true, data: alertas };
      }

      let repuestos = await this.repository.repuestoFindAll();

      if (nombre) {
        repuestos = repuestos.filter(r => r.nombre.toLowerCase().includes(nombre.toLowerCase()));
      }
      if (codigo) {
        repuestos = repuestos.filter(r => r.codigo.toLowerCase().includes(codigo.toLowerCase()));
      }
      if (categoria_id) {
        repuestos = repuestos.filter(r => r.categoria_id === parseInt(categoria_id));
      }

      const resultado = await Promise.all(
        repuestos.map(async (repuesto) => {
          const stock = await this.repository.stockFindByRepuesto(repuesto.id);
          return { ...repuesto, stock: stock || { cantidad_disponible: 0, cantidad_minima: 0 } };
        })
      );

      return { success: true, data: resultado };
    } catch (error) {
      console.error('Error en stockConsultar:', error.message);
      return { success: false, message: error.message || 'Error al consultar stock' };
    }
  }

  async stockAlertas() {
    try {
      const alertas = await this.repository.stockGetBajo();
      const criticas = alertas.filter(a => a.cantidad_disponible === 0);
      const medias = alertas.filter(a => a.cantidad_disponible > 0 && a.cantidad_disponible <= a.cantidad_minima / 2);
      const normales = alertas.filter(a => a.cantidad_disponible > a.cantidad_minima / 2 && a.cantidad_disponible <= a.cantidad_minima);

      return {
        success: true,
        data: {
          total: alertas.length,
          criticas,
          medias,
          normales,
          todas: alertas
        }
      };
    } catch (error) {
      console.error('Error en stockAlertas:', error.message);
      return { success: false, message: error.message || 'Error al obtener alertas' };
    }
  }

  async movimientoCreate(data) {
    try {
      const { repuesto_id, tipo_movimiento, cantidad, motivo, orden_id, usuario_id } = data;

      if (!repuesto_id) {
        return { success: false, message: 'El repuesto es obligatorio' };
      }
      if (!tipo_movimiento || !['entrada', 'salida'].includes(tipo_movimiento)) {
        return { success: false, message: 'Tipo de movimiento inválido' };
      }
      if (!cantidad || cantidad <= 0) {
        return { success: false, message: 'La cantidad debe ser mayor a 0' };
      }

      const repuesto = await this.repository.repuestoFindById(parseInt(repuesto_id));
      if (!repuesto) {
        return { success: false, message: 'Repuesto no encontrado' };
      }

      if (tipo_movimiento === 'salida') {
        const stock = await this.repository.stockFindByRepuesto(parseInt(repuesto_id));
        if (!stock || stock.cantidad_disponible < parseInt(cantidad)) {
          return {
            success: false,
            message: `Stock insuficiente. Disponible: ${stock?.cantidad_disponible || 0}`
          };
        }
      }

      const movimiento = await this.repository.movimientoCreate({
        repuesto_id: parseInt(repuesto_id),
        tipo_movimiento,
        cantidad: parseInt(cantidad),
        motivo: motivo || (tipo_movimiento === 'entrada' ? 'Entrada de inventario' : 'Salida de inventario'),
        orden_id: orden_id || null,
        usuario_id: usuario_id || null
      });

      const cantidadAjuste = tipo_movimiento === 'entrada' ? parseInt(cantidad) : -parseInt(cantidad);
      await this.repository.stockActualizarCantidad(parseInt(repuesto_id), cantidadAjuste);

      const stockActualizado = await this.repository.stockFindByRepuesto(parseInt(repuesto_id));

      return {
        success: true,
        message: `Movimiento de ${tipo_movimiento} registrado`,
        data: { movimiento, stock: stockActualizado }
      };
    } catch (error) {
      console.error('Error en movimientoCreate:', error.message);
      return { success: false, message: error.message || 'Error al registrar movimiento' };
    }
  }

  async movimientoGetAll(limit = 100, offset = 0) {
    try {
      const movimientos = await this.repository.movimientoFindAll(limit, offset);
      return { success: true, data: movimientos };
    } catch (error) {
      console.error('Error en movimientoGetAll:', error.message);
      return { success: false, message: 'Error al obtener movimientos' };
    }
  }

  async movimientoGetByRepuesto(repuestoId) {
    try {
      const movimientos = await this.repository.movimientoFindByRepuesto(repuestoId);
      return { success: true, data: movimientos };
    } catch (error) {
      console.error('Error en movimientoGetByRepuesto:', error.message);
      return { success: false, message: 'Error al obtener movimientos del repuesto' };
    }
  }

  async movimientoReporte(fechaInicio, fechaFin) {
    try {
      const reporte = await this.repository.movimientoReporte(fechaInicio, fechaFin);
      return { success: true, data: reporte };
    } catch (error) {
      console.error('Error en movimientoReporte:', error.message);
      return { success: false, message: 'Error al generar reporte' };
    }
  }

  async solicitudCreate(data) {
    try {
      const { orden_id, repuesto_id, cantidad_solicitada, mecanico_id } = data;

      if (!orden_id) {
        return { success: false, message: 'La orden es obligatoria' };
      }
      if (!repuesto_id) {
        return { success: false, message: 'El repuesto es obligatorio' };
      }
      if (!cantidad_solicitada || cantidad_solicitada <= 0) {
        return { success: false, message: 'La cantidad debe ser mayor a 0' };
      }

      const repuesto = await this.repository.repuestoFindById(parseInt(repuesto_id));
      if (!repuesto) {
        return { success: false, message: 'Repuesto no encontrado' };
      }

      const stock = await this.repository.stockFindByRepuesto(parseInt(repuesto_id));
      if (!stock || stock.cantidad_disponible < parseInt(cantidad_solicitada)) {
        return {
          success: false,
          message: `Stock insuficiente. Disponible: ${stock?.cantidad_disponible || 0}`
        };
      }

      const solicitud = await this.repository.solicitudCreate({
        orden_id,
        repuesto_id: parseInt(repuesto_id),
        cantidad_solicitada: parseInt(cantidad_solicitada),
        costo_historico: repuesto.costo_unitario || 0,
        precio_historico: repuesto.precio_unitario || 0,
        mecanico_id: mecanico_id || null
      });

      console.log(`Solicitud #${solicitud.id} creada para repuesto ${repuesto.nombre}`);

      return {
        success: true,
        message: 'Solicitud creada correctamente',
        data: solicitud
      };
    } catch (error) {
      console.error('Error en solicitudCreate:', error.message);
      return { success: false, message: error.message || 'Error al crear solicitud' };
    }
  }

  async solicitudAprobar(id, estado, aprobado_por) {
    try {
      if (!['aprobada', 'rechazada'].includes(estado)) {
        return { success: false, message: 'Estado inválido' };
      }

      const solicitud = await this.repository.solicitudFindById(id);
      if (!solicitud) {
        return { success: false, message: 'Solicitud no encontrada' };
      }

      if (solicitud.estado !== 'pendiente') {
        return { success: false, message: `La solicitud ya fue ${solicitud.estado}` };
      }

      if (estado === 'aprobada') {
        const stock = await this.repository.stockFindByRepuesto(solicitud.repuesto_id);
        if (!stock || stock.cantidad_disponible < solicitud.cantidad_solicitada) {
          return {
            success: false,
            message: `Stock insuficiente. Disponible: ${stock?.cantidad_disponible || 0}`
          };
        }

        await this.movimientoCreate({
          repuesto_id: solicitud.repuesto_id,
          tipo_movimiento: 'salida',
          cantidad: solicitud.cantidad_solicitada,
          motivo: `Solicitud #${solicitud.id} aprobada para orden ${solicitud.orden_id}`,
          orden_id: solicitud.orden_id,
          usuario_id: aprobado_por
        });
      }

      const solicitudActualizada = await this.repository.solicitudAprobar(
        parseInt(id),
        estado,
        aprobado_por
      );

      return {
        success: true,
        message: `Solicitud ${estado === 'aprobada' ? 'aprobada' : 'rechazada'}`,
        data: solicitudActualizada
      };
    } catch (error) {
      console.error('Error en solicitudAprobar:', error.message);
      return { success: false, message: error.message || 'Error al procesar solicitud' };
    }
  }

  async solicitudGetPendientes() {
    try {
      const solicitudes = await this.repository.solicitudFindPendientes();
      return { success: true, data: solicitudes };
    } catch (error) {
      console.error('Error en solicitudGetPendientes:', error.message);
      return { success: false, message: 'Error al obtener solicitudes pendientes' };
    }
  }

  async solicitudGetByOrden(ordenId) {
    try {
      const solicitudes = await this.repository.solicitudFindByOrden(ordenId);
      return { success: true, data: solicitudes };
    } catch (error) {
      console.error('Error en solicitudGetByOrden:', error.message);
      return { success: false, message: 'Error al obtener solicitudes de la orden' };
    }
  }

  async solicitudGetAll() {
    try {
      const solicitudes = await this.repository.solicitudFindAll();
      return { success: true, data: solicitudes };
    } catch (error) {
      console.error('Error en solicitudGetAll:', error.message);
      return { success: false, message: 'Error al obtener solicitudes' };
    }
  }

  async solicitudFindById(id) {
    try {
      const sql = `
        SELECT s.*, r.nombre AS repuesto_nombre
        FROM solicitudes_repuestos s
        JOIN repuestos r ON s.repuesto_id = r.id
        WHERE s.id = $1
      `;
      const result = await this.repository.query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error en solicitudFindById:', error.message);
      return null;
    }
  }
}

module.exports = new InventarioService();