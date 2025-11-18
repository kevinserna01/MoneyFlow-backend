import { UsuarioModel } from '../models/Usuario.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class UsuariosController {
  // Validar formato de email
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar formato de teléfono (básico)
  static validateTelefono(telefono) {
    const telefonoRegex = /^[\d\s\-\+\(\)]+$/;
    return telefonoRegex.test(telefono) && telefono.length >= 8;
  }

  // Remover contraseña de la respuesta
  static removePassword(usuario) {
    if (!usuario) return usuario;
    const { contraseña, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  }

  // Hashear contraseña con SHA-256 y salt
  static hashPassword(contraseña) {
    // Generar un salt aleatorio
    const salt = crypto.randomBytes(16).toString('hex');
    // Hashear la contraseña con SHA-256
    const hash = crypto.createHash('sha256').update(contraseña + salt).digest('hex');
    // Retornar hash y salt combinados (hash:salt)
    return `${hash}:${salt}`;
  }

  // Verificar contraseña comparando con el hash almacenado
  static verifyPassword(contraseña, hashAlmacenado) {
    try {
      // Separar el hash y el salt (formato: hash:salt)
      const [hash, salt] = hashAlmacenado.split(':');
      // Hashear la contraseña proporcionada con el mismo salt
      const hashVerificado = crypto.createHash('sha256').update(contraseña + salt).digest('hex');
      // Comparar los hashes
      return hash === hashVerificado;
    } catch (error) {
      return false;
    }
  }

  // GET /api/usuarios
  static async getAll(req, res) {
    try {
      const usuarios = await UsuarioModel.findAll();
      // Remover contraseñas de la respuesta
      const usuariosSinPassword = usuarios.map(usuario => UsuariosController.removePassword(usuario));
      
      res.status(200).json({
        success: true,
        data: usuariosSinPassword,
        count: usuariosSinPassword.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/usuarios/:id
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const usuario = await UsuarioModel.findById(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: UsuariosController.removePassword(usuario)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/usuarios
  static async create(req, res) {
    try {
      const { nombre, telefono, correo, contraseña } = req.body;
      
      // Validaciones de campos requeridos
      if (!nombre || !telefono || !correo || !contraseña) {
        return res.status(400).json({
          success: false,
          error: 'Todos los campos son requeridos: nombre, telefono, correo, contraseña'
        });
      }

      // Validar formato de email
      if (!UsuariosController.validateEmail(correo)) {
        return res.status(400).json({
          success: false,
          error: 'El formato del correo electrónico no es válido'
        });
      }

      // Validar formato de teléfono
      if (!UsuariosController.validateTelefono(telefono)) {
        return res.status(400).json({
          success: false,
          error: 'El formato del teléfono no es válido'
        });
      }

      // Validar longitud de contraseña
      if (contraseña.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Verificar si el correo ya existe
      const usuarioExistente = await UsuarioModel.findByCorreo(correo);
      if (usuarioExistente) {
        return res.status(409).json({
          success: false,
          error: 'El correo electrónico ya está registrado'
        });
      }

      // Hashear la contraseña con SHA-256
      const contraseñaHash = UsuariosController.hashPassword(contraseña);

      // Crear usuario con contraseña hasheada
      const usuarioData = {
        nombre,
        telefono,
        correo,
        contraseña: contraseñaHash
      };

      const nuevoUsuario = await UsuarioModel.create(usuarioData);
      
      res.status(201).json({
        success: true,
        data: UsuariosController.removePassword(nuevoUsuario),
        message: 'Usuario creado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // PUT /api/usuarios/:id
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, telefono, correo, contraseña } = req.body;
      const usuarioData = {};

      // Validar y agregar campos solo si se proporcionan
      if (nombre !== undefined) usuarioData.nombre = nombre;
      if (telefono !== undefined) {
        if (!UsuariosController.validateTelefono(telefono)) {
          return res.status(400).json({
            success: false,
            error: 'El formato del teléfono no es válido'
          });
        }
        usuarioData.telefono = telefono;
      }
      if (correo !== undefined) {
        if (!UsuariosController.validateEmail(correo)) {
          return res.status(400).json({
            success: false,
            error: 'El formato del correo electrónico no es válido'
          });
        }
        // Verificar si el correo ya existe en otro usuario
        const usuarioConCorreo = await UsuarioModel.findByCorreo(correo);
        if (usuarioConCorreo && usuarioConCorreo.id !== id) {
          return res.status(409).json({
            success: false,
            error: 'El correo electrónico ya está registrado'
          });
        }
        usuarioData.correo = correo;
      }
      if (contraseña !== undefined) {
        if (contraseña.length < 6) {
          return res.status(400).json({
            success: false,
            error: 'La contraseña debe tener al menos 6 caracteres'
          });
        }
        // Hashear la nueva contraseña con SHA-256
        usuarioData.contraseña = UsuariosController.hashPassword(contraseña);
      }

      // Si no hay datos para actualizar
      if (Object.keys(usuarioData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionaron datos para actualizar'
        });
      }

      const usuarioActualizado = await UsuarioModel.update(id, usuarioData);
      
      if (!usuarioActualizado) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: UsuariosController.removePassword(usuarioActualizado),
        message: 'Usuario actualizado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/usuarios/:id/contrasena-actual
  static async getContraseñaActual(req, res) {
    try {
      const { id } = req.params;

      // Obtener el usuario
      const usuario = await UsuarioModel.findById(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Retornar la contraseña hasheada (sin deshashear, ya que es imposible)
      // El frontend mostrará asteriscos o un campo deshabilitado
      res.status(200).json({
        success: true,
        data: {
          tieneContraseña: !!usuario.contraseña,
          // No enviamos la contraseña real por seguridad, solo indicamos que existe
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // PUT /api/usuarios/:id/cambiar-contrasena
  static async cambiarContraseña(req, res) {
    try {
      const { id } = req.params;
      const { nuevaContraseña, confirmarContraseña } = req.body;

      // Validar campos requeridos
      if (!nuevaContraseña || !confirmarContraseña) {
        return res.status(400).json({
          success: false,
          error: 'Los campos nuevaContraseña y confirmarContraseña son requeridos'
        });
      }

      // Validar que la nueva contraseña y la confirmación coincidan
      if (nuevaContraseña !== confirmarContraseña) {
        return res.status(400).json({
          success: false,
          error: 'La nueva contraseña y la confirmación no coinciden'
        });
      }

      // Validar longitud mínima de la nueva contraseña
      if (nuevaContraseña.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Obtener el usuario
      const usuario = await UsuarioModel.findById(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Verificar que la nueva contraseña sea diferente a la actual
      const mismaContraseña = UsuariosController.verifyPassword(nuevaContraseña, usuario.contraseña);
      if (mismaContraseña) {
        return res.status(400).json({
          success: false,
          error: 'La nueva contraseña debe ser diferente a la contraseña actual'
        });
      }

      // Hashear la nueva contraseña
      const nuevaContraseñaHash = UsuariosController.hashPassword(nuevaContraseña);

      // Actualizar la contraseña
      const usuarioActualizado = await UsuarioModel.update(id, {
        contraseña: nuevaContraseñaHash
      });

      res.status(200).json({
        success: true,
        data: UsuariosController.removePassword(usuarioActualizado),
        message: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/usuarios/login
  static async login(req, res) {
    try {
      const { correo, contraseña } = req.body;

      // Validar campos requeridos
      if (!correo || !contraseña) {
        return res.status(400).json({
          success: false,
          error: 'Correo y contraseña son requeridos'
        });
      }

      // Buscar usuario por correo
      const usuario = await UsuarioModel.findByCorreo(correo);
      
      if (!usuario) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const contraseñaValida = UsuariosController.verifyPassword(contraseña, usuario.contraseña);
      
      if (!contraseñaValida) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_key_super_segura_cambiar_en_produccion';
      const token = jwt.sign(
        { 
          id: usuario.id, 
          correo: usuario.correo 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Retornar usuario sin contraseña y token
      res.status(200).json({
        success: true,
        data: {
          usuario: UsuariosController.removePassword(usuario),
          token: token
        },
        message: 'Login exitoso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // DELETE /api/usuarios/:id
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const resultado = await UsuarioModel.delete(id);
      
      res.status(200).json({
        success: true,
        message: resultado.message || 'Usuario eliminado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

