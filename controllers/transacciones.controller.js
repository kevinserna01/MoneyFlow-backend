import { TransaccionModel } from '../models/Transaccion.model.js';
import { CategoriaModel } from '../models/Categoria.model.js';

const TIPOS_VALIDOS = ['ingreso', 'gasto'];

export class TransaccionesController {
  // Actualizar presupuesto de categoría de ingresos
  static async actualizarPresupuestoCategoria(categoriaId, monto, operacion = 'sumar') {
    try {
      const categoria = await CategoriaModel.findById(categoriaId);
      if (!categoria || categoria.tipo !== 'ingresos') {
        return; // Solo actualizar si es categoría de ingresos
      }

      const presupuestoActual = categoria.presupuestoMensual || 0;
      let nuevoPresupuesto;

      if (operacion === 'sumar') {
        nuevoPresupuesto = presupuestoActual + Number(monto);
      } else if (operacion === 'restar') {
        nuevoPresupuesto = Math.max(0, presupuestoActual - Number(monto));
      } else if (operacion === 'ajustar') {
        // Para actualizaciones: se pasa { montoAnterior, montoNuevo }
        nuevoPresupuesto = presupuestoActual - Number(monto.montoAnterior) + Number(monto.montoNuevo);
        nuevoPresupuesto = Math.max(0, nuevoPresupuesto);
      }

      await CategoriaModel.update(categoriaId, {
        presupuestoMensual: nuevoPresupuesto
      });
    } catch (error) {
      // No lanzar error para no interrumpir la creación de la transacción
      console.error('Error al actualizar presupuesto de categoría:', error);
    }
  }

  // Sumar gasto de vuelta al presupuesto de las categorías de ingresos del usuario
  // (usado cuando se elimina o actualiza un gasto)
  // Suma de vuelta a las categorías en orden inverso (las que tienen menos presupuesto primero)
  static async sumarGastoAIngresos(usuarioId, monto) {
    try {
      // Obtener todas las categorías de ingresos del usuario
      const categoriasIngresos = await CategoriaModel.findAll({ 
        usuarioId, 
        tipo: 'ingresos' 
      });

      if (categoriasIngresos.length === 0) {
        return; // No hay categorías de ingresos, no hacer nada
      }

      const montoGasto = Number(monto);
      let montoRestante = montoGasto;

      // Obtener el presupuesto original de cada categoría (suma de transacciones de ingreso)
      // Para esto, necesitamos calcular cuánto debería tener cada categoría basado en sus transacciones
      // Por ahora, sumamos equitativamente entre todas las categorías
      // En el futuro se podría mejorar para rastrear de qué categoría se restó originalmente
      
      // Ordenar categorías por presupuesto actual (menor a mayor) para sumar primero a las que tienen menos
      const categoriasOrdenadas = categoriasIngresos
        .map(cat => ({ ...cat, presupuesto: cat.presupuestoMensual || 0 }))
        .sort((a, b) => a.presupuesto - b.presupuesto);

      // Sumar equitativamente entre todas las categorías
      const montoPorCategoria = montoGasto / categoriasOrdenadas.length;
      
      for (const categoria of categoriasOrdenadas) {
        const presupuestoActual = categoria.presupuesto || 0;
        const nuevoPresupuesto = presupuestoActual + montoPorCategoria;
        
        await CategoriaModel.update(categoria.id, {
          presupuestoMensual: nuevoPresupuesto
        });
      }
    } catch (error) {
      // No lanzar error para no interrumpir la operación
      console.error('Error al sumar gasto a ingresos:', error);
    }
  }

  // Restar gasto del presupuesto de las categorías de ingresos del usuario
  // Resta directamente de cada categoría hasta agotar el presupuesto (no proporcionalmente)
  static async restarGastoDeIngresos(usuarioId, monto, operacion = 'restar') {
    try {
      // Obtener todas las categorías de ingresos del usuario ordenadas por presupuesto (mayor a menor)
      const categoriasIngresos = await CategoriaModel.findAll({ 
        usuarioId, 
        tipo: 'ingresos' 
      });

      if (categoriasIngresos.length === 0) {
        return; // No hay categorías de ingresos, no hacer nada
      }

      const montoGasto = Number(monto);
      let montoRestante = montoGasto;

      // Ordenar categorías por presupuesto (mayor a menor) para restar primero de las que tienen más
      const categoriasOrdenadas = categoriasIngresos
        .map(cat => ({ ...cat, presupuesto: cat.presupuestoMensual || 0 }))
        .sort((a, b) => b.presupuesto - a.presupuesto);

      // Restar directamente de cada categoría hasta agotar el monto
      for (const categoria of categoriasOrdenadas) {
        if (montoRestante <= 0) {
          break; // Ya se restó todo el monto
        }

        const presupuestoCategoria = categoria.presupuesto || 0;
        
        if (presupuestoCategoria > 0) {
          // Restar el monto restante o el presupuesto disponible, el que sea menor
          const montoARestar = Math.min(montoRestante, presupuestoCategoria);
          const nuevoPresupuesto = Math.max(0, presupuestoCategoria - montoARestar);
          
          await CategoriaModel.update(categoria.id, {
            presupuestoMensual: nuevoPresupuesto
          });
          
          montoRestante -= montoARestar;
        }
      }

      // Si queda monto restante después de agotar todos los presupuestos, se genera alerta
      // (el presupuesto ya está en 0, no hay más dinero disponible)
      if (montoRestante > 0.01) {
        console.warn(`⚠️ ALERTA: Se intentó gastar $${montoRestante.toFixed(2)} más de lo disponible en ingresos`);
      }
    } catch (error) {
      // No lanzar error para no interrumpir la creación de la transacción
      console.error('Error al restar gasto de ingresos:', error);
    }
  }

  static validatePayload(data, { partial = false } = {}) {
    const errors = [];

    if (!partial || data.tipo !== undefined) {
      if (!data.tipo || !TIPOS_VALIDOS.includes(data.tipo)) {
        errors.push('El tipo es requerido y debe ser ingreso o gasto');
      }
    }

    if (!partial || data.monto !== undefined) {
      if (data.monto === undefined || Number(data.monto) <= 0) {
        errors.push('El monto es requerido y debe ser mayor a 0');
      }
    }

    if (!partial || data.categoriaId !== undefined) {
      if (!data.categoriaId || typeof data.categoriaId !== 'string') {
        errors.push('La categoría es requerida');
      }
    }

    if (!partial || data.usuarioId !== undefined) {
      if (!data.usuarioId || typeof data.usuarioId !== 'string') {
        errors.push('El usuarioId es requerido');
      }
    }

    if (!partial || data.fecha !== undefined) {
      if (!data.fecha || Number.isNaN(new Date(data.fecha).getTime())) {
        errors.push('La fecha es requerida y debe ser válida');
      }
    }

    return errors;
  }

  static sanitizePayload(body, { partial = false } = {}) {
    const payload = {};
    const assignIfPresent = (field, value) => {
      if (value !== undefined) {
        payload[field] = value;
      }
    };

    assignIfPresent('tipo', body.tipo);
    assignIfPresent('monto', body.monto !== undefined ? Number(body.monto) : undefined);
    assignIfPresent('categoriaId', body.categoriaId);
    assignIfPresent('usuarioId', body.usuarioId);
    assignIfPresent('descripcion', body.descripcion?.trim() || '');

    if (body.fecha !== undefined) {
      payload.fecha = new Date(body.fecha);
    } else if (!partial) {
      payload.fecha = new Date();
    }

    return payload;
  }

  static async getAll(req, res) {
    try {
      const { usuarioId, tipo, categoriaId } = req.query;
      const transacciones = await TransaccionModel.findAll({ usuarioId, tipo, categoriaId });
      res.status(200).json({
        success: true,
        data: transacciones,
        count: transacciones.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const transaccion = await TransaccionModel.findById(id);

      if (!transaccion) {
        return res.status(404).json({
          success: false,
          error: 'Transacción no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: transaccion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const payload = TransaccionesController.sanitizePayload(req.body);
      const errors = TransaccionesController.validatePayload(payload);

      if (errors.length) {
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }

      const categoria = await CategoriaModel.findById(payload.categoriaId);
      if (!categoria) {
        return res.status(404).json({
          success: false,
          error: 'Categoría no encontrada'
        });
      }

      if (categoria.usuarioId !== payload.usuarioId) {
        return res.status(403).json({
          success: false,
          error: 'La categoría no pertenece al usuario'
        });
      }

      const transaccionData = {
        ...payload,
        categoriaNombre: categoria.nombre,
        categoriaIcono: categoria.icono,
        categoriaTipo: categoria.tipo
      };

      const nuevaTransaccion = await TransaccionModel.create(transaccionData);
      
      // Si es una transacción de ingreso, actualizar el presupuesto de la categoría
      if (payload.tipo === 'ingreso' && categoria.tipo === 'ingresos') {
        await TransaccionesController.actualizarPresupuestoCategoria(
          payload.categoriaId,
          payload.monto,
          'sumar'
        );
      }
      
      // Si es una transacción de gasto, restar del presupuesto de todas las categorías de ingresos
      if (payload.tipo === 'gasto') {
        await TransaccionesController.restarGastoDeIngresos(
          payload.usuarioId,
          payload.monto,
          'restar'
        );
      }

      res.status(201).json({
        success: true,
        data: nuevaTransaccion,
        message: 'Transacción registrada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const payload = TransaccionesController.sanitizePayload(req.body, { partial: true });

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionaron datos para actualizar'
        });
      }

      const errors = TransaccionesController.validatePayload(payload, { partial: true });
      if (errors.length) {
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }

      // Obtener la transacción actual para comparar cambios
      const transaccionActual = await TransaccionModel.findById(id);
      if (!transaccionActual) {
        return res.status(404).json({
          success: false,
          error: 'Transacción no encontrada'
        });
      }

      if (payload.categoriaId) {
        const categoria = await CategoriaModel.findById(payload.categoriaId);
        if (!categoria) {
          return res.status(404).json({
            success: false,
            error: 'Categoría no encontrada'
          });
        }

        if (payload.usuarioId && categoria.usuarioId !== payload.usuarioId) {
          return res.status(403).json({
            success: false,
            error: 'La categoría no pertenece al usuario'
          });
        }

        payload.categoriaNombre = categoria.nombre;
        payload.categoriaIcono = categoria.icono;
        payload.categoriaTipo = categoria.tipo;
      }

      // Si se actualizó el monto de una transacción de ingreso, ajustar el presupuesto ANTES de actualizar
      if (payload.monto !== undefined && transaccionActual.tipo === 'ingreso') {
        const categoriaId = payload.categoriaId || transaccionActual.categoriaId;
        const categoria = await CategoriaModel.findById(categoriaId);
        
        if (categoria && categoria.tipo === 'ingresos') {
          // Si cambió la categoría, restar del anterior y sumar al nuevo
          if (payload.categoriaId && payload.categoriaId !== transaccionActual.categoriaId) {
            // Restar del presupuesto de la categoría anterior
            await TransaccionesController.actualizarPresupuestoCategoria(
              transaccionActual.categoriaId,
              transaccionActual.monto,
              'restar'
            );
            // Sumar al presupuesto de la nueva categoría
            await TransaccionesController.actualizarPresupuestoCategoria(
              payload.categoriaId,
              payload.monto,
              'sumar'
            );
          } else {
            // Misma categoría, ajustar la diferencia
            await TransaccionesController.actualizarPresupuestoCategoria(
              categoriaId,
              {
                montoAnterior: transaccionActual.monto,
                montoNuevo: payload.monto
              },
              'ajustar'
            );
          }
        }
      }

      // Si se actualizó el monto de una transacción de gasto, ajustar el presupuesto de ingresos
      if (payload.monto !== undefined && transaccionActual.tipo === 'gasto') {
        const usuarioId = payload.usuarioId || transaccionActual.usuarioId;
        
        // Primero, sumar de vuelta el monto anterior (como si se eliminara)
        await TransaccionesController.sumarGastoAIngresos(usuarioId, transaccionActual.monto);
        
        // Luego, restar el nuevo monto
        await TransaccionesController.restarGastoDeIngresos(usuarioId, payload.monto);
      }
      
      // Si cambió el tipo de transacción
      if (payload.tipo && payload.tipo !== transaccionActual.tipo) {
        const usuarioId = payload.usuarioId || transaccionActual.usuarioId;
        
        // Si cambió de ingreso a gasto
        if (transaccionActual.tipo === 'ingreso' && payload.tipo === 'gasto') {
          // Restar del presupuesto de la categoría de ingreso
          const categoriaId = payload.categoriaId || transaccionActual.categoriaId;
          await TransaccionesController.actualizarPresupuestoCategoria(
            categoriaId,
            transaccionActual.monto,
            'restar'
          );
          // Restar del presupuesto de todas las categorías de ingresos
          await TransaccionesController.restarGastoDeIngresos(usuarioId, transaccionActual.monto);
        }
        // Si cambió de gasto a ingreso
        else if (transaccionActual.tipo === 'gasto' && payload.tipo === 'ingreso') {
          // Sumar de vuelta el gasto a los ingresos
          await TransaccionesController.sumarGastoAIngresos(usuarioId, transaccionActual.monto);
          // Sumar al presupuesto de la categoría de ingreso
          const categoriaId = payload.categoriaId || transaccionActual.categoriaId;
          await TransaccionesController.actualizarPresupuestoCategoria(
            categoriaId,
            transaccionActual.monto,
            'sumar'
          );
        }
      }

      const transaccionActualizada = await TransaccionModel.update(id, payload);
      if (!transaccionActualizada) {
        return res.status(404).json({
          success: false,
          error: 'Transacción no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: transaccionActualizada,
        message: 'Transacción actualizada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener la transacción antes de eliminarla
      const transaccion = await TransaccionModel.findById(id);
      if (!transaccion) {
        return res.status(404).json({
          success: false,
          error: 'Transacción no encontrada'
        });
      }

      await TransaccionModel.delete(id);
      
      // Si es una transacción de ingreso, restar del presupuesto de la categoría
      if (transaccion.tipo === 'ingreso') {
        const categoria = await CategoriaModel.findById(transaccion.categoriaId);
        if (categoria && categoria.tipo === 'ingresos') {
          await TransaccionesController.actualizarPresupuestoCategoria(
            transaccion.categoriaId,
            transaccion.monto,
            'restar'
          );
        }
      }
      
      // Si es una transacción de gasto, sumar de vuelta al presupuesto de todas las categorías de ingresos
      if (transaccion.tipo === 'gasto') {
        await TransaccionesController.sumarGastoAIngresos(
          transaccion.usuarioId,
          transaccion.monto
        );
      }

      res.status(200).json({
        success: true,
        message: 'Transacción eliminada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/transacciones/resumen/:usuarioId
  static async getResumen(req, res) {
    try {
      const { usuarioId } = req.params;
      
      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          error: 'usuarioId es requerido'
        });
      }

      const resumen = await TransaccionModel.getResumenGeneral(usuarioId);
      
      res.status(200).json({
        success: true,
        data: resumen
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/transacciones/estadisticas/:usuarioId
  static async getEstadisticas(req, res) {
    try {
      const { usuarioId } = req.params;
      const { año, mes } = req.query;
      
      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          error: 'usuarioId es requerido'
        });
      }

      const añoNum = año ? parseInt(año) : null;
      const mesNum = mes ? parseInt(mes) : null;

      const estadisticas = await TransaccionModel.getEstadisticasMensuales(usuarioId, añoNum, mesNum);
      
      res.status(200).json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

