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

En este entregable todavía no se implementa persistencia en base de datos ni la lógica completa del negocio.

## Objetivo

Configurar la base técnica inicial del backend de Stride & Co. utilizando Node.js y Express.

Se busca aplicar una arquitectura organizada basada en la separación de responsabilidades entre rutas y controladores, preparar los principales endpoints REST de la aplicación, incorporar logging de solicitudes HTTP, análisis de calidad de código, pruebas automatizadas y un flujo de trabajo colaborativo utilizando Git y GitHub.

La arquitectura general utilizada es:

```text
HTTP Request -> Express -> Route -> Controller -> Response Mock
```

## Tecnologías utilizadas

- Node.js
- Express
- JavaScript
- Jest
- Supertest
- ESLint
- Morgan
- Git
- GitHub

## Requisitos previos

- Node.js
- npm
- Git

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

## Endpoints

La API puede utilizar las siguientes operaciones REST:

| Método | Ruta |
|---|---|
| `GET` | `/api/products` |
| `GET` | `/api/products/:id` |
| `POST` | `/api/products` |
| `PUT` | `/api/products/:id` |
| `DELETE` | `/api/products/:id` |

## Pruebas

Las pruebas automatizadas se realizan con Jest y Supertest.

```bash
npm test
```

Ahora mismo hay pruebas para los endpoints de productos que comprueban:

- Código HTTP esperado.
- Estructura de la respuesta.
- Consulta por ID.
- Creación de productos.
- Actualización de productos.
- Eliminación de productos.
- Comportamiento ante IDs inexistentes.
- Comportamiento ante solicitudes sin datos.

También se puede ejecutar directamente la prueba de productos:

```bash
npx jest test/products.test.js
```

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
|-- bin/
|   `-- www
|-- controllers/
|-- public/
|   `-- stylesheets/
|-- routes/
|-- tests/
|-- views/
|-- app.js
|-- eslint.config.js
|-- package.json
|-- package-lock.json
|-- .gitignore
`-- README.md
```

## Control de versiones

El proyecto utiliza Git y GitHub para el trabajo colaborativo, ademas los commits siguen la especificación Conventional Commits.

## Estado actual

El proyecto se encuentra en la etapa inicial del backend.

- Proyecto Express configurado.
- Separación entre rutas y controladores.
- Endpoints REST iniciales.
- Respuestas mock.
- Logging de solicitudes HTTP.
- ESLint.
- Pruebas automatizadas.
- Control de versiones con Git y GitHub.

La persistencia mediante base de datos, autenticación, autorización y reglas de negocio todavia no se implementa.

## Equipo

Equipo 3:

- Kevin Andrés Rosales Rodríguez
- Edwin Noé Zaragoza Alvarado
- Nohemí Posada Atayde
- Manuel Ramirez Contreras