import express from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';

const router = express.Router();

// Rutas de usuarios
router.get('/', UsuariosController.getAll);
router.post('/login', UsuariosController.login);
router.get('/:id/contrasena-actual', UsuariosController.getContraseñaActual); // Debe ir antes de /:id
router.put('/:id/cambiar-contrasena', UsuariosController.cambiarContraseña); // Debe ir antes de /:id
router.get('/:id', UsuariosController.getById);
router.post('/', UsuariosController.create);
router.put('/:id', UsuariosController.update);
router.delete('/:id', UsuariosController.delete);

export default router;

