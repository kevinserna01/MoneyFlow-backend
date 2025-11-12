import 'dotenv/config'; // Cargar variables de entorno
import express from 'express';
import cors from 'cors';
import './config/firebase.js'; // Inicializar Firebase

// Importar rutas
import usuariosRoutes from './routes/usuarios.routes.js';

const app = express();
const PORT = 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/usuarios', usuariosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend MoneyFlow API',
    status: 'running',
    port: PORT
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});

