import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'categorias';

export class CategoriaModel {
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
      const createdDoc = await docRef.get();
      return this.formatDoc(createdDoc);
    } catch (error) {
      throw new Error(`Error al crear categoría: ${error.message}`);
    }
  }

  static async findAll({ usuarioId, tipo } = {}) {
    try {
      let query = db.collection(COLLECTION_NAME);

      if (usuarioId) {
        query = query.where('usuarioId', '==', usuarioId);
      }

      if (tipo) {
        query = query.where('tipo', '==', tipo);
      }

      const snapshot = await query.get();
      const categorias = [];
      snapshot.forEach(doc => {
        categorias.push(this.formatDoc(doc));
      });
      return categorias;
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      return this.formatDoc(doc);
    } catch (error) {
      throw new Error(`Error al obtener categoría: ${error.message}`);
    }
  }

  static async findByNombre(nombre, usuarioId) {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('usuarioId', '==', usuarioId)
        .where('nombre', '==', nombre)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return this.formatDoc(snapshot.docs[0]);
    } catch (error) {
      throw new Error(`Error al buscar categoría por nombre: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      const docRef = db.collection(COLLECTION_NAME).doc(id);
      await docRef.update({
        ...data,
        updatedAt: new Date()
      });
      const updatedDoc = await docRef.get();
      return this.formatDoc(updatedDoc);
    } catch (error) {
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
      return { message: 'Categoría eliminada correctamente' };
    } catch (error) {
      throw new Error(`Error al eliminar categoría: ${error.message}`);
    }
  }
}

