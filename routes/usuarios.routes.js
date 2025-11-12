import express from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';

const router = express.Router();

// Rutas de usuarios
router.get('/', UsuariosController.getAll);
router.get('/:id', UsuariosController.getById);
router.post('/', UsuariosController.create);
router.post('/login', UsuariosController.login); // Ruta de login (debe ir antes de /:id)
router.put('/:id', UsuariosController.update);
router.delete('/:id', UsuariosController.delete);

export default router;

