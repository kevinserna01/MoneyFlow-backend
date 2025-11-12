# 📱 API MoneyFlow - Documentación para Android

Documentación completa de la API REST para la aplicación móvil desarrollada con Jetpack Compose.

## 📋 Información General

- **Base URL**: `http://tu-servidor:4000/api`
- **Formato de datos**: JSON
- **Autenticación**: JWT Bearer Token
- **Versión**: 1.0.0

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Después de hacer login, recibirás un token que debes incluir en todas las peticiones que requieran autenticación.

### Header de Autenticación

```
Authorization: Bearer <token>
```

**Nota**: El token expira después de 24 horas. Cuando expire, el usuario deberá hacer login nuevamente.

---

## 📡 Endpoints

### 1. Health Check

Verifica que el servidor esté funcionando.

**Endpoint**: `GET /`

**Headers**: No requiere

**Response 200 OK**:
```json
{
  "message": "Backend MoneyFlow API",
  "status": "running",
  "port": 4000
}
```

---

### 2. Login

Inicia sesión con correo y contraseña.

**Endpoint**: `POST /api/usuarios/login`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "correo": "usuario@example.com",
  "contraseña": "password123"
}
```

**Response 200 OK** (Login exitoso):
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "abc123xyz456",
      "nombre": "Juan Pérez",
      "telefono": "+1234567890",
      "correo": "usuario@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFiYzEyM3h5ejQ1NiIsImNvcnJlbyI6InVzdWFyaW9AZXhhbXBsZS5jb20iLCJpYXQiOjE2NDIzNDU2NzgsImV4cCI6MTY0MjQzMjA3OH0.xyz..."
  },
  "message": "Login exitoso"
}
```

**Response 400 Bad Request** (Campos faltantes):
```json
{
  "success": false,
  "error": "Correo y contraseña son requeridos"
}
```

**Response 401 Unauthorized** (Credenciales inválidas):
```json
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

**Response 500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### 3. Crear Usuario

Registra un nuevo usuario en el sistema.

**Endpoint**: `POST /api/usuarios`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "nombre": "Juan Pérez",
  "telefono": "+1234567890",
  "correo": "juan.perez@example.com",
  "contraseña": "password123"
}
```

**Validaciones**:
- `nombre`: Requerido
- `telefono`: Requerido, mínimo 8 caracteres
- `correo`: Requerido, formato de email válido, único
- `contraseña`: Requerido, mínimo 6 caracteres

**Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "id": "abc123xyz456",
    "nombre": "Juan Pérez",
    "telefono": "+1234567890",
    "correo": "juan.perez@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Usuario creado correctamente"
}
```

**Response 400 Bad Request** (Validación fallida):
```json
{
  "success": false,
  "error": "Todos los campos son requeridos: nombre, telefono, correo, contraseña"
}
```

**Response 400 Bad Request** (Formato inválido):
```json
{
  "success": false,
  "error": "El formato del correo electrónico no es válido"
}
```

**Response 409 Conflict** (Correo ya registrado):
```json
{
  "success": false,
  "error": "El correo electrónico ya está registrado"
}
```

---

### 4. Obtener Todos los Usuarios

Obtiene la lista de todos los usuarios registrados.

**Endpoint**: `GET /api/usuarios`

**Headers**: No requiere autenticación (por ahora)

**Response 200 OK**:
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "nombre": "Juan Pérez",
      "telefono": "+1234567890",
      "correo": "juan@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "def456",
      "nombre": "María García",
      "telefono": "+0987654321",
      "correo": "maria@example.com",
      "createdAt": "2024-01-16T11:20:00.000Z",
      "updatedAt": "2024-01-16T11:20:00.000Z"
    }
  ],
  "count": 2
}
```

---

### 5. Obtener Usuario por ID

Obtiene la información de un usuario específico.

**Endpoint**: `GET /api/usuarios/:id`

**Path Parameters**:
- `id` (string, requerido): ID del usuario

**Headers**: No requiere autenticación (por ahora)

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "abc123xyz456",
    "nombre": "Juan Pérez",
    "telefono": "+1234567890",
    "correo": "juan.perez@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response 404 Not Found**:
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

---

### 6. Actualizar Usuario

Actualiza la información de un usuario existente.

**Endpoint**: `PUT /api/usuarios/:id`

**Path Parameters**:
- `id` (string, requerido): ID del usuario

**Headers**:
```
Content-Type: application/json
```

**Request Body** (todos los campos son opcionales, solo envía los que quieras actualizar):
```json
{
  "nombre": "Juan Carlos Pérez",
  "telefono": "+1234567891",
  "correo": "juan.carlos@example.com",
  "contraseña": "nuevaPassword456"
}
```

**Validaciones**:
- `telefono`: Si se envía, mínimo 8 caracteres
- `correo`: Si se envía, formato de email válido, único
- `contraseña`: Si se envía, mínimo 6 caracteres

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "abc123xyz456",
    "nombre": "Juan Carlos Pérez",
    "telefono": "+1234567891",
    "correo": "juan.carlos@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  },
  "message": "Usuario actualizado correctamente"
}
```

**Response 400 Bad Request** (Sin datos para actualizar):
```json
{
  "success": false,
  "error": "No se proporcionaron datos para actualizar"
}
```

**Response 404 Not Found**:
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

**Response 409 Conflict** (Correo ya registrado):
```json
{
  "success": false,
  "error": "El correo electrónico ya está registrado"
}
```

---

### 7. Eliminar Usuario

Elimina un usuario del sistema.

**Endpoint**: `DELETE /api/usuarios/:id`

**Path Parameters**:
- `id` (string, requerido): ID del usuario

**Headers**: No requiere autenticación (por ahora)

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Usuario eliminado correctamente"
}
```

**Response 500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 📊 Modelos de Datos

### Usuario

```json
{
  "id": "string",
  "nombre": "string",
  "telefono": "string",
  "correo": "string",
  "createdAt": "ISO 8601 DateTime",
  "updatedAt": "ISO 8601 DateTime"
}
```

**Nota**: El campo `contraseña` nunca se devuelve en las respuestas por seguridad.

---

## 🔢 Códigos de Estado HTTP

| Código | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa (GET, PUT, DELETE) |
| 201 | Created | Recurso creado exitosamente (POST) |
| 400 | Bad Request | Error de validación o datos inválidos |
| 401 | Unauthorized | Credenciales inválidas o token faltante |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: correo duplicado) |
| 500 | Internal Server Error | Error del servidor |

---

## ⚠️ Manejo de Errores

Todas las respuestas de error siguen este formato:

```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

### Errores Comunes

1. **Campos requeridos faltantes**
   - Código: 400
   - Mensaje: "Todos los campos son requeridos: nombre, telefono, correo, contraseña"

2. **Formato de email inválido**
   - Código: 400
   - Mensaje: "El formato del correo electrónico no es válido"

3. **Formato de teléfono inválido**
   - Código: 400
   - Mensaje: "El formato del teléfono no es válido"

4. **Contraseña muy corta**
   - Código: 400
   - Mensaje: "La contraseña debe tener al menos 6 caracteres"

5. **Correo ya registrado**
   - Código: 409
   - Mensaje: "El correo electrónico ya está registrado"

6. **Credenciales inválidas**
   - Código: 401
   - Mensaje: "Credenciales inválidas"

7. **Usuario no encontrado**
   - Código: 404
   - Mensaje: "Usuario no encontrado"

---

## 📱 Ejemplo de Implementación en Kotlin (Retrofit)

### 1. Modelos de Datos

```kotlin
// Usuario.kt
data class Usuario(
    val id: String,
    val nombre: String,
    val telefono: String,
    val correo: String,
    val createdAt: String,
    val updatedAt: String
)

// LoginRequest.kt
data class LoginRequest(
    val correo: String,
    val contraseña: String
)

// CreateUsuarioRequest.kt
data class CreateUsuarioRequest(
    val nombre: String,
    val telefono: String,
    val correo: String,
    val contraseña: String
)

// UpdateUsuarioRequest.kt
data class UpdateUsuarioRequest(
    val nombre: String? = null,
    val telefono: String? = null,
    val correo: String? = null,
    val contraseña: String? = null
)

// ApiResponse.kt
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val message: String? = null,
    val count: Int? = null
)

// LoginResponse.kt
data class LoginResponse(
    val usuario: Usuario,
    val token: String
)
```

### 2. Interfaz de API (Retrofit)

```kotlin
// ApiService.kt
import retrofit2.http.*

interface ApiService {
    
    @POST("usuarios/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<LoginResponse>
    
    @POST("usuarios")
    suspend fun createUsuario(@Body request: CreateUsuarioRequest): ApiResponse<Usuario>
    
    @GET("usuarios")
    suspend fun getAllUsuarios(): ApiResponse<List<Usuario>>
    
    @GET("usuarios/{id}")
    suspend fun getUsuarioById(@Path("id") id: String): ApiResponse<Usuario>
    
    @PUT("usuarios/{id}")
    suspend fun updateUsuario(
        @Path("id") id: String,
        @Body request: UpdateUsuarioRequest
    ): ApiResponse<Usuario>
    
    @DELETE("usuarios/{id}")
    suspend fun deleteUsuario(@Path("id") id: String): ApiResponse<Unit>
}
```

### 3. Cliente Retrofit con Interceptor de Autenticación

```kotlin
// ApiClient.kt
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    private const val BASE_URL = "http://tu-servidor:4000/api/"
    
    private var token: String? = null
    
    fun setToken(newToken: String?) {
        token = newToken
    }
    
    private val authInterceptor = Interceptor { chain ->
        val request = chain.request().newBuilder()
        token?.let {
            request.addHeader("Authorization", "Bearer $it")
        }
        request.addHeader("Content-Type", "application/json")
        chain.proceed(request.build())
    }
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val client = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .build()
    
    val apiService: ApiService = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(ApiService::class.java)
}
```

### 4. Repositorio

```kotlin
// UsuarioRepository.kt
class UsuarioRepository {
    private val api = ApiClient.apiService
    
    suspend fun login(correo: String, contraseña: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(correo, contraseña))
            if (response.success && response.data != null) {
                // Guardar token
                ApiClient.setToken(response.data.token)
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Error desconocido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createUsuario(
        nombre: String,
        telefono: String,
        correo: String,
        contraseña: String
    ): Result<Usuario> {
        return try {
            val response = api.createUsuario(
                CreateUsuarioRequest(nombre, telefono, correo, contraseña)
            )
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Error desconocido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getAllUsuarios(): Result<List<Usuario>> {
        return try {
            val response = api.getAllUsuarios()
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Error desconocido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getUsuarioById(id: String): Result<Usuario> {
        return try {
            val response = api.getUsuarioById(id)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Error desconocido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateUsuario(
        id: String,
        nombre: String? = null,
        telefono: String? = null,
        correo: String? = null,
        contraseña: String? = null
    ): Result<Usuario> {
        return try {
            val response = api.updateUsuario(
                id,
                UpdateUsuarioRequest(nombre, telefono, correo, contraseña)
            )
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Error desconocido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteUsuario(id: String): Result<Unit> {
        return try {
            val response = api.deleteUsuario(id)
            if (response.success) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.error ?: "Error desconocido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 5. ViewModel (Ejemplo)

```kotlin
// LoginViewModel.kt
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {
    private val repository = UsuarioRepository()
    
    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState: StateFlow<LoginState> = _loginState
    
    fun login(correo: String, contraseña: String) {
        viewModelScope.launch {
            _loginState.value = LoginState.Loading
            repository.login(correo, contraseña)
                .onSuccess { loginResponse ->
                    _loginState.value = LoginState.Success(loginResponse)
                }
                .onFailure { error ->
                    _loginState.value = LoginState.Error(error.message ?: "Error desconocido")
                }
        }
    }
}

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    data class Success(val loginResponse: LoginResponse) : LoginState()
    data class Error(val message: String) : LoginState()
}
```

---

## 🔒 Seguridad

1. **Contraseñas**: Nunca se devuelven en las respuestas. Se almacenan hasheadas con SHA-256.
2. **Tokens JWT**: Expiran después de 24 horas.
3. **HTTPS**: En producción, siempre usa HTTPS (no HTTP).
4. **Almacenamiento de tokens**: Guarda el token de forma segura (SharedPreferences encriptado o DataStore).

---

## 📝 Notas Importantes

1. **Base URL**: Reemplaza `http://tu-servidor:4000` con la URL real de tu servidor.
2. **CORS**: El servidor tiene CORS habilitado, pero asegúrate de configurarlo correctamente en producción.
3. **Timezone**: Las fechas se devuelven en formato ISO 8601 (UTC).
4. **Validaciones**: El backend valida todos los datos antes de procesarlos.
5. **Errores de red**: Implementa manejo de errores de conexión en tu app.

---

## 🚀 Próximos Pasos

- Implementar refresh tokens para renovar la sesión sin hacer login
- Agregar middleware de autenticación para proteger rutas
- Implementar paginación para listas grandes
- Agregar filtros y búsqueda

---

**Última actualización**: Enero 2024
**Versión de la API**: 1.0.0

