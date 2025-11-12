import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'usuarios';

export class UsuarioModel {
  // Crear un nuevo usuario
  static async create(usuarioData) {
    try {
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...usuarioData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id: docRef.id, ...usuarioData };
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  // Obtener todos los usuarios
  static async findAll() {
    try {
      const snapshot = await db.collection(COLLECTION_NAME).get();
      const usuarios = [];
      snapshot.forEach(doc => {
        usuarios.push({ id: doc.id, ...doc.data() });
      });
      return usuarios;
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  // Obtener un usuario por ID
  static async findById(id) {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  // Actualizar un usuario
  static async update(id, usuarioData) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update({
        ...usuarioData,
        updatedAt: new Date()
      });
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  // Eliminar un usuario
  static async delete(id) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
      return { message: 'Usuario eliminado correctamente' };
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  // Buscar usuarios por campo
  static async findByField(field, value) {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
        .where(field, '==', value)
        .get();
      const usuarios = [];
      snapshot.forEach(doc => {
        usuarios.push({ id: doc.id, ...doc.data() });
      });
      return usuarios;
    } catch (error) {
      throw new Error(`Error al buscar usuarios: ${error.message}`);
    }
  }

  // Buscar usuario por correo
  static async findByCorreo(correo) {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('correo', '==', correo)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Error al buscar usuario por correo: ${error.message}`);
    }
  }
}

