# Stride & Co.

## Datos académicos

| Campo | Detalle |
|---|---|
| **Universidad** | Universidad Autónoma de Chihuahua |
| **Facultad** | Facultad de Ingeniería |
| **Carrera** | Ingeniería en Computación |
| **Materia** | Desarrollo de Aplicaciones Web |
| **Docente** | Mtro. Luis Antonio Ramírez Martínez |
| **Actividad** | Proyecto 1: Configuración Inicial del Backend  |
| **Equipo** | Equipo 3 |
| **Alumnos** | Kevin Andrés Rosales Rodríguez<br>Edwin Noé Zaragoza Alvarado<br>Nohemí Posada Atayde<br>Manuel Ramirez Contreras |
| **Matrículas** | 385814<br>385609<br>385520<br>385703 |
| **Fecha de entrega** | 20/09/2026 |

## Descripción

Stride & Co. es una tienda deportiva que actualmente gestiona parte de sus ventas y pedidos mediante mensajes de WhatsApp y procesos manuales.

El proyecto busca digitalizar la operación de la tienda mediante una aplicación web que permita centralizar la información del catálogo, controlar el inventario, registrar pedidos y facilitar la administración de usuarios, roles, permisos, clientes y productos.

Este repositorio corresponde al backend de la aplicación. En esta primera etapa se configuró la arquitectura inicial utilizando Node.js y Express, separando las rutas de los controladores y utilizando respuestas mock para comprobar el funcionamiento de la API.
El repositorio contiene una aplicación desarrollada con Node.js y Express, organizada por módulos y rutas, con lógica de negocio separada en controladores y soporte para autenticación mediante JWT.

La aplicación está orientada a servir como base para un sistema de administración de una tienda deportiva y a facilitar operaciones como alta de usuarios, gestión de productos, control de inventario y registro de pedidos.

## Objetivo

Configurar la base técnica inicial del backend de Stride & Co. utilizando Node.js y Express.

Se busca aplicar una arquitectura organizada basada en la separación de responsabilidades entre rutas y controladores, preparar los principales endpoints REST de la aplicación, incorporar logging de solicitudes HTTP, análisis de calidad de código, pruebas automatizadas y un flujo de trabajo colaborativo utilizando Git y GitHub.

La arquitectura general utilizada es:

```text
HTTP Request -> Express -> Route -> Controller -> Response Mock
```

## Tecnologías utilizadas


### Backend
- Node.js
- Express.js
- JavaScript

### Base de datos
- MySQL con Sequelize
- MongoDB con Mongoose

### Seguridad
- JWT
- express-jwt
- bcrypt

### Herramientas y calidad
- Jest
- Supertest
- ESLint
- Morgan
- Supervisor
- Docker


## Requisitos previos
- Node.js 18 o superior
- npm
- Git
- MySQL local (para Sequelize)
- MongoDB local (si se usa la configuración de Mongoose)

## Instalación

```bash
git clone https://github.com/Mozeu/Stride-And-Co.git
cd Stride-And-Co
npm install
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de Express |
| `npm run dev` | Inicia el servidor en modo desarrollo |
| `npm test` | Ejecuta las pruebas automatizadas con Jest |
| `npm run lint` | Ejecuta ESLint para analizar la calidad del código |

## Recursos de la API

Actualmente la API cuenta con los siguientes recursos:

```text
/api/users
/api/roles
/api/permissions
/api/products
/api/variants
/api/inventory
/api/customers
/api/orders
```

Cada recurso se encuentra entre:

```text
routes/
controllers/
```

## Endpoints principales

La API expone recursos bajo el prefijo `/api`.

### Autenticación

```text
POST /api/auth/login
GET  /api/auth/me
```

### Usuarios

```text
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Roles

```text
GET    /api/roles
GET    /api/roles/:id
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id
```

### Permisos

```text
GET    /api/permissions
GET    /api/permissions/:id
POST   /api/permissions
PUT    /api/permissions/:id
DELETE /api/permissions/:id
```

### Productos

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Variantes

```text
GET    /api/variants
GET    /api/variants/:id
POST   /api/variants
PUT    /api/variants/:id
DELETE /api/variants/:id
```

### Inventario

```text
GET  /api/inventory
GET  /api/inventory/:id
PUT  /api/inventory/:id
```

### Clientes

```text
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Pedidos

```text
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id
```

## Autenticación

La autenticación del backend usa `bcrypt` para proteger las contraseñas, `jsonwebtoken` para emitir tokens JWT y `express-jwt` para validarlos.

### Metodo para proteger contraseñas

En `utils/password.js` se usa `bcrypt.genSalt()` con el factor de costo configurado por `BCRYPT_SALT_ROUNDS` para crear un salt y luego `bcrypt.hash(password, saltKey)` para generar el `password_hash`. La validación se realiza con `bcrypt.compare(password, passwordHash)`.

El modelo de usuario en `models/relationals/User.js` almacena estos campos:

- `password_hash`
- `salt_key`

Esto permite conservar la contraseña protegida y verificarla sin exponer el valor original.

### Librerias para JWT

Se utiliza `jsonwebtoken` para firmar los tokens y `express-jwt` para verificar su firma, expiración, issuer y audience. El token usa el algoritmo `HS256` y contiene únicamente el identificador del usuario en `sub`. Estos valores se configuran mediante variables de entorno:

| Variable | Uso |
|---|---|
| `JWT_SECRET` | Clave compartida para firmar y verificar tokens. No debe publicarse ni guardarse en el repositorio. |
| `JWT_EXPIRES_IN` | Vigencia del token; por ejemplo, `15m`. |
| `JWT_ISSUER` | Emisor esperado del token; por ejemplo, `stride-co`. |
| `JWT_AUDIENCE` | Audiencia esperada del token; por ejemplo, `stride-co-api`. |
| `BCRYPT_SALT_ROUNDS` | Factor de costo de bcrypt; por ejemplo, `10`. |

Configura estas variables en un archivo `.env` local a partir de `.env.example` y completa `JWT_SECRET` con una clave segura propia. La aplicación no inicia si faltan variables JWT requeridas.

### Endpoint de login

```http
POST /api/auth/login
```

Ejemplo de cuerpo esperado:

```json
{
  "email": "usuario@correo.com",
  "password": "123456"
}
```

Respuesta esperada:

```json
{
  "message": "Login successful",
  "data": {
    "token": "<jwt_token>",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

### Endpoint `/api/auth/me`

```http
GET /api/auth/me
```

Este endpoint requiere autenticación y devuelve la información del usuario autenticado sin incluir el `password_hash` ni el `salt_key`.
La autenticación se aplica a los endpoints bajo `/api`; las rutas fuera de ese prefijo no requieren token. `POST /api/auth/login` es la excepción pública para obtener el token.

### Header de autorización

Ejemplo del header enviado en peticiones protegidas:

```http
Authorization: Bearer <token>
```

El token expira después del valor configurado en `JWT_EXPIRES_IN` (15 minutos en el ejemplo).
## Pruebas

El proyecto incluye pruebas automatizadas con Jest y Supertest para validar el comportamiento principal de los endpoints.

```bash
npm test
```

Archivos de pruebas actuales:

- `tests/products.test.js`
- `tests/users.test.js`
- `tests/roles.test.js`
- `tests/permissions.test.js`
- `tests/variants.test.js`
- `tests/inventory.test.js`
- `tests/customers.test.js`
- `tests/orders.test.js`

## Calidad de código

El proyecto utiliza ESLint para mantener un estilo consistente y detectar posibles errores.

Para ejecutar el análisis:

```bash
npm run lint
```

## Logging

La aplicación utiliza Morgan para registrar las solicitudes HTTP realizadas al servidor.

```text
GET /api/products 200
POST /api/products 201
```

## Estructura del proyecto

```text
Stride-And-Co/
├── app.js
├── Dockerfile
├── eslint.config.js
├── package.json
├── README.md
├── README_ACTUALIZADO.md
├── bin/
│   └── www
├── config/
│   ├── mongoose.js
│   └── sequelize.js
├── controllers/
│   ├── auth.js
│   ├── customers.js
│   ├── index.js
│   ├── inventory.js
│   ├── orders.js
│   ├── permissions.js
│   ├── products.js
│   ├── roles.js
│   ├── users.js
│   └── variants.js
├── middleware/
│   └── authenticate.js
├── models/
│   ├── documents/
│   │   ├── customer.js
│   │   ├── index.js
│   │   └── order.js
│   └── relationals/
│       ├── index.js
│       ├── Permissions.js
│       ├── Roles.js
│       └── User.js
├── public/
│   └── stylesheets/
│       └── style.css
├── routes/
│   ├── auth.js
│   ├── customers.js
│   ├── index.js
│   ├── inventory.js
│   ├── orders.js
│   ├── permissions.js
│   ├── products.js
│   ├── roles.js
│   ├── users.js
│   └── variants.js
├── tests/
│   ├── customers.test.js
│   ├── inventory.test.js
│   ├── orders.test.js
│   ├── permissions.test.js
│   ├── products.test.js
│   ├── roles.test.js
│   ├── users.test.js
│   └── variants.test.js
├── utils/
│   └── password.js
├── views/
│   ├── error.pug
│   ├── index.pug
│   └── layout.pug
└── .gitignore
```


## Control de versiones

El proyecto utiliza Git y GitHub para el trabajo colaborativo, ademas los commits siguen la especificación Conventional Commits.

## Estado actual del proyecto

El backend ya se encuentra en una etapa funcional con estructura modular y rutas REST implementadas para los principales recursos del negocio.

Entre los elementos que están presentes en el proyecto se encuentran:

- API REST con Express
- Módulos de usuarios, roles y permisos
- CRUD de productos y variantes
- Gestión de inventario
- Registro de clientes
- Gestión de pedidos
- Autenticación con JWT
- Middlewares para protección de rutas
- Configuración para MySQL y MongoDB
- Pruebas automatizadas con Jest y Supertest
- Linting con ESLint
- Estructura de modelos y configuraciones separadas por responsabilidad

## Equipo

Equipo 3:

- Kevin Andrés Rosales Rodríguez
- Edwin Noé Zaragoza Alvarado
- Nohemí Posada Atayde
- Manuel Ramirez Contreras