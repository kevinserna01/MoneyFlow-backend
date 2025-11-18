import express from 'express';
import { TransaccionesController } from '../controllers/transacciones.controller.js';

const router = express.Router();

router.get('/', TransaccionesController.getAll);
router.get('/resumen/:usuarioId', TransaccionesController.getResumen); // Debe ir antes de /:id
router.get('/estadisticas/:usuarioId', TransaccionesController.getEstadisticas); // Debe ir antes de /:id
router.get('/:id', TransaccionesController.getById);
router.post('/', TransaccionesController.create);
router.put('/:id', TransaccionesController.update);
router.delete('/:id', TransaccionesController.delete);

export default router;

