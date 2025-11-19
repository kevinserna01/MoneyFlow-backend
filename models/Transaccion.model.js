import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'transacciones';

export class TransaccionModel {
  static formatDoc(doc) {
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async create(data) {
    try {
      const timestamp = new Date();
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      const created = await docRef.get();
      return this.formatDoc(created);
    } catch (error) {
      throw new Error(`Error al crear transacción: ${error.message}`);
    }
  }

  static async findAll({ usuarioId, tipo, categoriaId } = {}) {
    try {
      let query = db.collection(COLLECTION_NAME);

      if (usuarioId) {
        query = query.where('usuarioId', '==', usuarioId);
      }

      if (tipo) {
        query = query.where('tipo', '==', tipo);
      }

      if (categoriaId) {
        query = query.where('categoriaId', '==', categoriaId);
      }

      const snapshot = await query.orderBy('fecha', 'desc').get();
      const transacciones = [];
      snapshot.forEach(doc => transacciones.push(this.formatDoc(doc)));
      return transacciones;
    } catch (error) {
      throw new Error(`Error al obtener transacciones: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      return this.formatDoc(doc);
    } catch (error) {
      throw new Error(`Error al obtener transacción: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      const docRef = db.collection(COLLECTION_NAME).doc(id);
      await docRef.update({
        ...data,
        updatedAt: new Date()
      });
      const updated = await docRef.get();
      return this.formatDoc(updated);
    } catch (error) {
      throw new Error(`Error al actualizar transacción: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
      return { message: 'Transacción eliminada correctamente' };
    } catch (error) {
      throw new Error(`Error al eliminar transacción: ${error.message}`);
    }
  }

  // Calcular el total gastado en una categoría específica
  static async getTotalGastadoPorCategoria(categoriaId, usuarioId) {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('categoriaId', '==', categoriaId)
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'gasto')
        .get();
      
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += Number(data.monto || 0);
      });
      
      return total;
    } catch (error) {
      throw new Error(`Error al calcular total gastado: ${error.message}`);
    }
  }

  // Calcular el total gastado para múltiples categorías (optimizado)
  static async getTotalGastadoPorCategorias(categoriaIds, usuarioId) {
    try {
      if (!categoriaIds || categoriaIds.length === 0) {
        return {};
      }

      const totals = {};
      categoriaIds.forEach(id => {
        totals[id] = 0;
      });

      // Firestore limita el operador 'in' a 10 elementos, dividir en lotes si es necesario
      const batchSize = 10;
      for (let i = 0; i < categoriaIds.length; i += batchSize) {
        const batch = categoriaIds.slice(i, i + batchSize);
        
        const snapshot = await db.collection(COLLECTION_NAME)
          .where('categoriaId', 'in', batch)
          .where('usuarioId', '==', usuarioId)
          .where('tipo', '==', 'gasto')
          .get();

        snapshot.forEach(doc => {
          const data = doc.data();
          const catId = data.categoriaId;
          if (totals[catId] !== undefined) {
            totals[catId] += Number(data.monto || 0);
          }
        });
      }
      
      return totals;
    } catch (error) {
      throw new Error(`Error al calcular totales gastados: ${error.message}`);
    }
  }

  // Calcular total de ingresos de un usuario
  static async getTotalIngresos(usuarioId) {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'ingreso')
        .get();
      
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += Number(data.monto || 0);
      });
      
      return total;
    } catch (error) {
      throw new Error(`Error al calcular total de ingresos: ${error.message}`);
    }
  }

  // Calcular total de ingresos por categoría (presupuesto original)
  static async getTotalIngresosPorCategoria(categoriaId, usuarioId) {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('categoriaId', '==', categoriaId)
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'ingreso')
        .get();
      
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += Number(data.monto || 0);
      });
      
      return total;
    } catch (error) {
      throw new Error(`Error al calcular total de ingresos por categoría: ${error.message}`);
    }
  }

  // Calcular total de ingresos para múltiples categorías (optimizado)
  static async getTotalIngresosPorCategorias(categoriaIds, usuarioId) {
    try {
      if (!categoriaIds || categoriaIds.length === 0) {
        return {};
      }

      const totals = {};
      categoriaIds.forEach(id => {
        totals[id] = 0;
      });

      // Firestore limita el operador 'in' a 10 elementos, dividir en lotes si es necesario
      const batchSize = 10;
      for (let i = 0; i < categoriaIds.length; i += batchSize) {
        const batch = categoriaIds.slice(i, i + batchSize);

        const snapshot = await db.collection(COLLECTION_NAME)
          .where('categoriaId', 'in', batch)
          .where('usuarioId', '==', usuarioId)
          .where('tipo', '==', 'ingreso')
          .get();

        snapshot.forEach(doc => {
          const data = doc.data();
          const catId = data.categoriaId;
          if (totals[catId] !== undefined) {
            totals[catId] += Number(data.monto || 0);
          }
        });
      }
      
      return totals;
    } catch (error) {
      throw new Error(`Error al calcular totales de ingresos por categorías: ${error.message}`);
    }
  }

  // Calcular total de gastos de un usuario
  static async getTotalGastos(usuarioId) {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'gasto')
        .get();
      
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += Number(data.monto || 0);
      });
      
      return total;
    } catch (error) {
      throw new Error(`Error al calcular total de gastos: ${error.message}`);
    }
  }

  // Obtener resumen general (ingresos, gastos, balance)
  static async getResumenGeneral(usuarioId) {
    try {
      const [totalIngresos, totalGastos] = await Promise.all([
        this.getTotalIngresos(usuarioId),
        this.getTotalGastos(usuarioId)
      ]);

      const balance = totalIngresos - totalGastos;
      const porcentajeUsado = totalIngresos > 0 ? (totalGastos / totalIngresos) * 100 : 0;

      return {
        totalIngresos,
        totalGastos,
        balance,
        porcentajeUsado: Math.round(porcentajeUsado * 100) / 100,
        restante: Math.max(0, balance)
      };
    } catch (error) {
      throw new Error(`Error al calcular resumen general: ${error.message}`);
    }
  }

  // Calcular totales por mes
  static async getTotalesPorMes(usuarioId, tipo, año, mes) {
    try {
      const inicioMes = new Date(año, mes - 1, 1);
      inicioMes.setHours(0, 0, 0, 0);
      const finMes = new Date(año, mes, 0, 23, 59, 59, 999);

      // Obtener todas las transacciones del usuario y tipo, luego filtrar por fecha
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', tipo)
        .get();

      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const fechaTransaccion = data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha);
        
        // Filtrar por mes
        if (fechaTransaccion >= inicioMes && fechaTransaccion <= finMes) {
          total += Number(data.monto || 0);
        }
      });

      return total;
    } catch (error) {
      throw new Error(`Error al calcular totales por mes: ${error.message}`);
    }
  }

  // Obtener estadísticas mensuales con comparación
  static async getEstadisticasMensuales(usuarioId, año, mes) {
    try {
      const fechaActual = new Date(año || new Date().getFullYear(), (mes || new Date().getMonth() + 1) - 1, 1);
      const añoActual = fechaActual.getFullYear();
      const mesActual = fechaActual.getMonth() + 1;

      // Calcular mes anterior
      const fechaAnterior = new Date(añoActual, mesActual - 2, 1);
      const añoAnterior = fechaAnterior.getFullYear();
      const mesAnterior = fechaAnterior.getMonth() + 1;

      // Obtener totales del mes actual
      const [ingresosActual, gastosActual] = await Promise.all([
        this.getTotalesPorMes(usuarioId, 'ingreso', añoActual, mesActual),
        this.getTotalesPorMes(usuarioId, 'gasto', añoActual, mesActual)
      ]);

      // Obtener totales del mes anterior
      const [ingresosAnterior, gastosAnterior] = await Promise.all([
        this.getTotalesPorMes(usuarioId, 'ingreso', añoAnterior, mesAnterior),
        this.getTotalesPorMes(usuarioId, 'gasto', añoAnterior, mesAnterior)
      ]);

      // Calcular porcentajes de cambio
      const porcentajeCambioIngresos = ingresosAnterior > 0
        ? ((ingresosActual - ingresosAnterior) / ingresosAnterior) * 100
        : ingresosActual > 0 ? 100 : 0;

      const porcentajeCambioGastos = gastosAnterior > 0
        ? ((gastosActual - gastosAnterior) / gastosAnterior) * 100
        : gastosActual > 0 ? 100 : 0;

      return {
        mesActual: {
          año: añoActual,
          mes: mesActual,
          ingresos: ingresosActual,
          gastos: gastosActual,
          balance: ingresosActual - gastosActual
        },
        mesAnterior: {
          año: añoAnterior,
          mes: mesAnterior,
          ingresos: ingresosAnterior,
          gastos: gastosAnterior,
          balance: ingresosAnterior - gastosAnterior
        },
        comparacion: {
          ingresos: {
            cambio: ingresosActual - ingresosAnterior,
            porcentajeCambio: Math.round(porcentajeCambioIngresos * 100) / 100,
            esPositivo: porcentajeCambioIngresos >= 0
          },
          gastos: {
            cambio: gastosActual - gastosAnterior,
            porcentajeCambio: Math.round(porcentajeCambioGastos * 100) / 100,
            esPositivo: porcentajeCambioGastos >= 0
          }
        }
      };
    } catch (error) {
      throw new Error(`Error al calcular estadísticas mensuales: ${error.message}`);
    }
  }
}

