import { CategoriaModel } from '../models/Categoria.model.js';
import { TransaccionModel } from '../models/Transaccion.model.js';

const TIPOS_VALIDOS = ['ingresos', 'gastos'];

export class CategoriasController {
  static validatePayload(body, { partial = false } = {}) {
    const errors = [];

    if (!partial || body.nombre !== undefined) {
      if (!body.nombre || typeof body.nombre !== 'string') {
        errors.push('El nombre es requerido');
      }
    }

    if (!partial || body.icono !== undefined) {
      if (!body.icono || typeof body.icono !== 'string') {
        errors.push('El icono es requerido');
      }
    }

    if (!partial || body.tipo !== undefined) {
      if (!body.tipo || !TIPOS_VALIDOS.includes(body.tipo)) {
        errors.push('El tipo es requerido y debe ser ingresos o gastos');
      }
    }

    if (!partial || body.usuarioId !== undefined) {
      if (!body.usuarioId || typeof body.usuarioId !== 'string') {
        errors.push('El usuarioId es requerido');
      }
    }

    // Validar presupuestoMensual según el tipo
    if (!partial || body.presupuestoMensual !== undefined) {
      const tipo = body.tipo;
      
      // Para gastos, el presupuesto es requerido
      if (tipo === 'gastos') {
        if (body.presupuestoMensual === undefined || body.presupuestoMensual === null) {
          errors.push('El presupuestoMensual es requerido para categorías de gastos');
        } else if (Number(body.presupuestoMensual) < 0) {
          errors.push('El presupuestoMensual no puede ser negativo');
        }
      } else if (tipo === 'ingresos') {
        // Para ingresos, el presupuesto es opcional pero si se envía debe ser >= 0
        if (body.presupuestoMensual !== undefined && body.presupuestoMensual !== null) {
          if (Number(body.presupuestoMensual) < 0) {
            errors.push('El presupuestoMensual no puede ser negativo');
          }
        }
      } else if (!partial && tipo) {
        // Si se especifica otro tipo (no debería pasar), validar que no sea negativo
        if (body.presupuestoMensual !== undefined && body.presupuestoMensual !== null) {
          if (Number(body.presupuestoMensual) < 0) {
            errors.push('El presupuestoMensual no puede ser negativo');
          }
        }
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

    assignIfPresent('nombre', body.nombre?.trim());
    assignIfPresent('icono', body.icono);
    assignIfPresent('tipo', body.tipo);
    
    // Para ingresos, presupuestoMensual es opcional (default 0)
    // Para gastos, presupuestoMensual es requerido
    const tipo = body.tipo;
    if (tipo === 'ingresos') {
      // Ingresos: opcional, default 0
      if (body.presupuestoMensual !== undefined && body.presupuestoMensual !== null) {
        payload.presupuestoMensual = Number(body.presupuestoMensual);
      } else if (!partial) {
        payload.presupuestoMensual = 0;
      }
    } else if (tipo === 'gastos') {
      // Gastos: requerido
      assignIfPresent('presupuestoMensual', Number(body.presupuestoMensual ?? 0));
    } else {
      // Si no se especifica tipo o es otro, asignar si está presente
      assignIfPresent('presupuestoMensual', body.presupuestoMensual !== undefined && body.presupuestoMensual !== null ? Number(body.presupuestoMensual) : undefined);
    }
    
    if (!partial) {
      payload.moneda = 'COP';
      if (tipo === 'ingresos' && payload.presupuestoMensual === undefined) {
        payload.presupuestoMensual = 0;
      }
    }
    
    assignIfPresent('descripcion', body.descripcion?.trim() || '');
    assignIfPresent('usuarioId', body.usuarioId);

    if (!partial) {
      payload.descripcion = payload.descripcion || '';
    }

    return payload;
  }

  // GET /api/categorias
  static async getAll(req, res) {
    try {
      const { usuarioId, tipo, includeStats } = req.query;
      const categorias = await CategoriaModel.findAll({ usuarioId, tipo });
      
      // Si se solicita incluir estadísticas y hay usuarioId
      if (includeStats === 'true' && usuarioId) {
        const categoriaIds = categorias.map(cat => cat.id);
        
        // Para categorías de gastos: calcular gastado por categoría
        // Para categorías de ingresos: calcular total de gastos del usuario
        const categoriasGastos = categorias.filter(cat => cat.tipo === 'gastos');
        const categoriasIngresos = categorias.filter(cat => cat.tipo === 'ingresos');
        
        const gastosPorCategoria = categoriasGastos.length > 0 
          ? await TransaccionModel.getTotalGastadoPorCategorias(
              categoriasGastos.map(cat => cat.id), 
              usuarioId
            )
          : {};
        
        // Para categorías de ingresos, obtener el total de gastos del usuario y el presupuesto original
        const totalGastosUsuario = categoriasIngresos.length > 0
          ? await TransaccionModel.getTotalGastos(usuarioId)
          : 0;
        
        // Obtener el presupuesto original (suma de transacciones de ingreso) por categoría
        const ingresosPorCategoria = categoriasIngresos.length > 0
          ? await TransaccionModel.getTotalIngresosPorCategorias(
              categoriasIngresos.map(cat => cat.id),
              usuarioId
            )
          : {};
        
        // Agregar estadísticas a cada categoría
        const categoriasConStats = categorias.map(categoria => {
          if (categoria.tipo === 'gastos') {
            // Estadísticas para categorías de gastos (como antes)
            const gastado = gastosPorCategoria[categoria.id] || 0;
            const presupuesto = categoria.presupuestoMensual || 0;
            const porcentajeUsado = presupuesto > 0 ? (gastado / presupuesto) * 100 : 0;
            const restante = presupuesto - gastado;
            const sobrepasado = gastado > presupuesto && presupuesto > 0;
            
            return {
              ...categoria,
              estadisticas: {
                gastado,
                presupuesto,
                porcentajeUsado: Math.round(porcentajeUsado * 100) / 100,
                restante: Math.max(0, restante),
                sobrepasado,
                exceso: sobrepasado ? gastado - presupuesto : 0
              }
            };
          } else if (categoria.tipo === 'ingresos') {
            // Estadísticas para categorías de ingresos
            const presupuestoOriginal = ingresosPorCategoria[categoria.id] || 0; // Suma de todas las transacciones de ingreso
            const presupuestoActual = categoria.presupuestoMensual || 0; // Presupuesto actual (después de restar gastos)
            const gastado = totalGastosUsuario; // Total de gastos del usuario
            const porcentajeUsado = presupuestoOriginal > 0 ? (gastado / presupuestoOriginal) * 100 : 0;
            const restante = presupuestoActual; // Dinero restante disponible
            const agotado = presupuestoActual <= 0 && presupuestoOriginal > 0; // Alerta si no hay más dinero
            const sobrepasado = gastado > presupuestoOriginal && presupuestoOriginal > 0;
            
            return {
              ...categoria,
              estadisticas: {
                gastado,
                presupuestoOriginal, // Presupuesto original (suma de ingresos)
                presupuestoActual,   // Presupuesto actual (después de restar gastos)
                porcentajeUsado: Math.round(porcentajeUsado * 100) / 100,
                restante: restante, // Permitir valores negativos para mostrar el exceso
                sobrepasado,
                agotado, // true si el presupuesto llegó a 0
                exceso: sobrepasado ? gastado - presupuestoOriginal : 0
              }
            };
          }
          
          // Si no es gastos ni ingresos, retornar sin estadísticas
          return categoria;
        });
        
        return res.status(200).json({
          success: true,
          data: categoriasConStats,
          count: categoriasConStats.length
        });
      }
      
      res.status(200).json({
        success: true,
        data: categorias,
        count: categorias.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/categorias/:id
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const { includeStats, usuarioId } = req.query;
      const categoria = await CategoriaModel.findById(id);

      if (!categoria) {
        return res.status(404).json({
          success: false,
          error: 'Categoría no encontrada'
        });
      }

      // Si se solicita incluir estadísticas y hay usuarioId
      if (includeStats === 'true' && usuarioId) {
        if (categoria.tipo === 'gastos') {
          // Estadísticas para categorías de gastos
          const gastado = await TransaccionModel.getTotalGastadoPorCategoria(id, usuarioId);
          const presupuesto = categoria.presupuestoMensual || 0;
          const porcentajeUsado = presupuesto > 0 ? (gastado / presupuesto) * 100 : 0;
          const restante = presupuesto - gastado;
          const sobrepasado = gastado > presupuesto && presupuesto > 0;
          const exceso = sobrepasado ? gastado - presupuesto : 0;

          return res.status(200).json({
            success: true,
            data: {
              ...categoria,
              estadisticas: {
                gastado,
                presupuesto,
                porcentajeUsado: Math.round(porcentajeUsado * 100) / 100,
                restante: Math.max(0, restante),
                sobrepasado,
                exceso
              }
            }
          });
        } else if (categoria.tipo === 'ingresos') {
          // Estadísticas para categorías de ingresos
          const totalGastosUsuario = await TransaccionModel.getTotalGastos(usuarioId);
          const presupuestoOriginal = await TransaccionModel.getTotalIngresosPorCategoria(id, usuarioId);
          const presupuestoActual = categoria.presupuestoMensual || 0;
          const gastado = totalGastosUsuario;
          const porcentajeUsado = presupuestoOriginal > 0 ? (gastado / presupuestoOriginal) * 100 : 0;
          const restante = presupuestoActual;
          const agotado = presupuestoActual <= 0 && presupuestoOriginal > 0;
          const sobrepasado = gastado > presupuestoOriginal && presupuestoOriginal > 0;
          const exceso = sobrepasado ? gastado - presupuestoOriginal : 0;

          return res.status(200).json({
            success: true,
            data: {
              ...categoria,
              estadisticas: {
                gastado,
                presupuestoOriginal,
                presupuestoActual,
                porcentajeUsado: Math.round(porcentajeUsado * 100) / 100,
                restante: restante,
                sobrepasado,
                agotado,
                exceso
              }
            }
          });
        }
      }

      res.status(200).json({
        success: true,
        data: categoria
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/categorias
  static async create(req, res) {
    try {
      const payload = CategoriasController.sanitizePayload(req.body);
      const errors = CategoriasController.validatePayload(payload);

      if (errors.length) {
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }

      // Verificar duplicado por nombre+usuario
      const categoriaExistente = await CategoriaModel.findByNombre(payload.nombre, payload.usuarioId);
      if (categoriaExistente) {
        return res.status(409).json({
          success: false,
          error: 'Ya tienes una categoría con ese nombre'
        });
      }

      const nuevaCategoria = await CategoriaModel.create(payload);
      res.status(201).json({
        success: true,
        data: nuevaCategoria,
        message: 'Categoría creada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // PUT /api/categorias/:id
  static async update(req, res) {
    try {
      const { id } = req.params;
      const payload = CategoriasController.sanitizePayload(req.body, { partial: true });

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionaron datos para actualizar'
        });
      }

      const errors = CategoriasController.validatePayload(payload, { partial: true });
      if (errors.length) {
        return res.status(400).json({
          success: false,
          error: errors.join(', ')
        });
      }

      // Verificar duplicado si cambia nombre
      if (payload.nombre && payload.usuarioId) {
        const categoriaExistente = await CategoriaModel.findByNombre(payload.nombre, payload.usuarioId);
        if (categoriaExistente && categoriaExistente.id !== id) {
          return res.status(409).json({
            success: false,
            error: 'Ya tienes una categoría con ese nombre'
          });
        }
      }

      const categoriaActualizada = await CategoriaModel.update(id, payload);
      if (!categoriaActualizada) {
        return res.status(404).json({
          success: false,
          error: 'Categoría no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: categoriaActualizada,
        message: 'Categoría actualizada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // DELETE /api/categorias/:id
  static async delete(req, res) {
    try {
      const { id } = req.params;
      await CategoriaModel.delete(id);
      res.status(200).json({
        success: true,
        message: 'Categoría eliminada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

