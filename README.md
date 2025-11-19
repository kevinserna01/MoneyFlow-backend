# MoneyFlow Backend API

API REST desarrollada con Express.js y Firebase Admin SDK para la gestión de usuarios, categorías y transacciones financieras.

## 📋 Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- Cuenta de **Firebase** con proyecto configurado
- Credenciales de **Firebase Admin SDK** (archivo JSON de service account)

## 💻 Instalación de Node.js y npm

### macOS (usando Homebrew)
```bash
# Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js (incluye npm)
brew install node

# Verificar instalación
node --version
npm --version
```

### Linux (Ubuntu/Debian)
```bash
# Actualizar paquetes
sudo apt update

# Instalar Node.js y npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### Windows (usando Chocolatey)
```bash
# Instalar Chocolatey (si no lo tienes)
# Ejecutar PowerShell como Administrador
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Node.js
choco install nodejs

# Verificar instalación
node --version
npm --version
```

### Windows (Instalador directo)
1. Descargar Node.js desde: https://nodejs.org/
2. Ejecutar el instalador y seguir los pasos
3. Verificar en PowerShell o CMD:
```bash
node --version
npm --version
```

## 🚀 Instalación

1. **Clonar el repositorio** (o navegar al directorio del proyecto)

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
   
   Crear archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Firebase Admin SDK - Service Account
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
```

**Nota:** Para obtener las credenciales:
- Ve a Firebase Console → Configuración del proyecto → Cuentas de servicio
- Genera una nueva clave privada (JSON)
- Copia los valores correspondientes al archivo `.env`

## ▶️ Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en: `http://localhost:4000`

## 📡 Endpoints

### Base URL
- **Local:** `http://localhost:4000/api`

### Rutas Disponibles

#### Usuarios (`/api/usuarios`)
- `GET /` - Obtener todos los usuarios
- `GET /:id` - Obtener usuario por ID
- `POST /` - Crear nuevo usuario
- `POST /login` - Autenticar usuario
- `PUT /:id` - Actualizar usuario
- `PUT /:id/cambiar-contrasena` - Cambiar contraseña
- `GET /:id/contrasena-actual` - Verificar contraseña actual
- `DELETE /:id` - Eliminar usuario

#### Categorías (`/api/categorias`)
- `GET /` - Obtener todas las categorías
- `GET /:id` - Obtener categoría por ID
- `POST /` - Crear nueva categoría
- `PUT /:id` - Actualizar categoría
- `DELETE /:id` - Eliminar categoría

#### Transacciones (`/api/transacciones`)
- `GET /` - Obtener todas las transacciones
- `GET /:id` - Obtener transacción por ID
- `POST /` - Crear nueva transacción
- `PUT /:id` - Actualizar transacción
- `DELETE /:id` - Eliminar transacción

## ⚠️ Notas Importantes

- **Variables de entorno:** Nunca commitees el archivo `.env` al repositorio
- **Firebase Private Key:** El formato con `\n` debe mantenerse exactamente como está
- **Puerto:** El servidor utiliza el puerto 4000 por defecto (configurable con variable `PORT`)

## 📦 Dependencias Principales

- `express` - Framework web
- `firebase-admin` - SDK de Firebase para Node.js
- `cors` - Middleware CORS
- `dotenv` - Gestión de variables de entorno
- `jsonwebtoken` - Autenticación JWT

## 🏗️ Estructura del Proyecto

```
MoneyFlow-backend/
├── config/
│   ├── firebase.js       # Configuración Firebase
├── controllers/          # Lógica de negocio
├── models/              # Modelos de datos
├── routes/              # Definición de rutas
├── index.js             # Punto de entrada
└── package.json         # Dependencias
```

## 🔧 Solución de Problemas

**Error: "Faltan variables de entorno de Firebase"**
- Verifica que el archivo `.env` existe y contiene todas las variables requeridas
- Asegúrate de que `FIREBASE_PRIVATE_KEY` incluye los saltos de línea `\n`

**Error al iniciar el servidor**
- Verifica que el puerto 4000 no esté en uso: `lsof -i :4000`
- Revisa que todas las dependencias estén instaladas: `npm install`
- Verifica que el archivo `.env` esté correctamente configurado

