# Backend MoneyFlow

Backend desarrollado con Express.js y Firebase, utilizando una arquitectura por capas.

## 🏗️ Estructura del Proyecto

```
backend-moneyflow/
├── config/
│   ├── firebase.js                    # Configuración de Firebase Admin SDK
│   └── firebase-service-account.json  # Credenciales de Firebase
├── controllers/
│   └── usuarios.controller.js         # Lógica de controladores
├── models/
│   └── Usuario.model.js               # Modelos de datos (Firestore)
├── routes/
│   └── usuarios.routes.js             # Definición de rutas
├── index.js                           # Punto de entrada de la aplicación
├── package.json
└── README.md
```

## 🚀 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables (puedes copiar de `.env.example` si existe):

```env
# JWT Secret Key para tokens de autenticación
JWT_SECRET=tu_secret_key_super_segura_cambiar_en_produccion

# Firebase Admin SDK Credentials
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=tu-service-account@tu-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
```

**Nota**: El `FIREBASE_PRIVATE_KEY` debe incluir los `\n` literales para los saltos de línea. Si copias desde un archivo JSON, asegúrate de mantener el formato.

## ▶️ Ejecución

### Modo desarrollo (con watch):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor se ejecutará en `http://localhost:4000`

## 📡 Endpoints

### Usuarios

- `GET /api/usuarios` - Obtener todos los usuarios
- `GET /api/usuarios/:id` - Obtener un usuario por ID
- `POST /api/usuarios` - Crear un nuevo usuario
- `POST /api/usuarios/login` - Iniciar sesión (autenticación)
- `PUT /api/usuarios/:id` - Actualizar un usuario
- `DELETE /api/usuarios/:id` - Eliminar un usuario

### Modelo de Usuario

El modelo de usuario incluye los siguientes campos:

- **nombre** (string, requerido): Nombre del usuario
- **telefono** (string, requerido): Teléfono del usuario (mínimo 8 caracteres)
- **correo** (string, requerido): Correo electrónico del usuario (formato válido, único)
- **contraseña** (string, requerido): Contraseña del usuario (mínimo 6 caracteres, hasheada con SHA-256)

**Nota**: Las contraseñas se hashean automáticamente antes de guardarse y nunca se devuelven en las respuestas de la API.

## 🏛️ Arquitectura por Capas

- **Models**: Interacción con Firestore (base de datos)
- **Controllers**: Lógica de negocio y manejo de requests/responses
- **Routes**: Definición de endpoints y enrutamiento
- **Config**: Configuraciones (Firebase, variables de entorno, etc.)

## 🔧 Tecnologías

- Express.js
- Firebase Admin SDK
- Firestore
- crypto (SHA-256 para hashing de contraseñas)
- jsonwebtoken (JWT para autenticación)
- CORS
- dotenv

## 🔒 Seguridad

- Las contraseñas se hashean usando SHA-256 con salt aleatorio antes de almacenarse
- Las contraseñas nunca se devuelven en las respuestas de la API
- Validación de formato de email y teléfono
- Validación de correo único (no se permiten duplicados)
- Autenticación mediante JWT (JSON Web Tokens)
- Tokens JWT con expiración de 24 horas

## 🔐 Autenticación

### Login

El endpoint de login (`POST /api/usuarios/login`) requiere:
- `correo`: Correo electrónico del usuario
- `contraseña`: Contraseña del usuario

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "abc123",
      "nombre": "Juan Pérez",
      "telefono": "+1234567890",
      "correo": "juan@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login exitoso"
}
```

El token JWT debe incluirse en el header `Authorization: Bearer <token>` para acceder a rutas protegidas (si las implementas en el futuro).

