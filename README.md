# Stride & Co.

Backend de la plataforma web de administración de Stride & Co.

## Descripción

Stride & Co. es una tienda deportiva que actualmente gestiona sus ventas y pedidos por medio de mensajes de WhatsApp y procesos manuales. El proyecto busca digitalizar la operación para centralizar el catálogo, controlar el inventario, registrar pedidos y mejorar la coordinación del equipo de ventas, operaciones y administración.

Este proyecto corresponde al backend de la aplicación y tiene como objetivo proporcionar la estructura inicial de una API REST utilizando Node.js y Express.

En este momento el sistema cuenta con rutas y controladores para los principales recursos de la aplicación, usando respuestas mock.

| Campo | Detalle |
|---|---|
| **Universidad** | Universidad Autónoma de Chihuahua |
| **Facultad** | Facultad de Ingeniería |
| **Carrera** | Ingeniería en Computación |
| **Materia** | Desarrollo de Aplicaciones Web |
| **Docente** | Mtro. Luis Antonio Ramírez Martínez |
| **Actividad** | Proyecto 1: Configuración Inicial del Backend  |
| **Alumnos**| Kevin Andrés Rosales Rodríguez |
|| Edwin Noé Zaragoza Alvarado |
|| Nohemí Posada Atayde |
|| Manuel Ramirez Contreras |
| **Matrículas** | 385814 |
| | 385609 |
| | 385520 |
| | 385703 |
| **Fecha de entrega** | 20/09/2026 |

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

git clone https://github.com/Mozeu/Stride-And-Co.git

cd Stride-And-Co

npm install

## Scripts disponibles

npm start

Inicia el servidor.

npm run dev

Inicia el servidor en modo desarrollo.

npm test

Ejecuta las pruebas automatizadas con Jest.

npm run lint

Analiza el código con ESLint.

## Estructura del proyecto

Stride-And-Co/
├── bin/
│   └── www
├── controllers/
├── public/
│   └── stylesheets/
├── routes/
├── tests/
├── views/
├── app.js
├── eslint.config.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md

La aplicación tiene el siguiente flujo:

Request -> Route -> Controller -> Response

Las rutas reciben las solicitudes HTTP y las dirigen al controlador correspondiente.

Los controladores procesan la solicitud y generan la respuesta.

En esta etapa del proyecto se utilizan respuestas mock y aun no se usa persistencia en base de datos.

## Recursos de la API

Actualmente la API cuenta con los siguientes recursos:

/api/users
/api/roles
/api/permissions
/api/products
/api/variants
/api/inventory
/api/customers
/api/orders

Cada recurso se encuentra en:

routes/
controllers/

## Endpoints

La API puede utilizar las siguientes operaciones REST:

GET    /api/resource
GET    /api/resource/:id
POST   /api/resource
PUT    /api/resource/:id
DELETE /api/resource/:id

Ejemplo, para productos:

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

## Pruebas

Las pruebas automatizadas se realizan con Jest y Supertest.

Para ejecutar todas las pruebas:

npm test

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

## Calidad de código

El proyecto utiliza ESLint para mantener un estilo consistente y detectar posibles errores.

Para ejecutar el análisis:

npm run lint

## Logging

La aplicación utiliza Morgan para registrar las solicitudes HTTP realizadas al servidor.

GET /api/products 200
POST /api/products 201

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

La persistencia mediante base de datos, autenticación, autorización y reglas de negocio todavia no se implementan.

## Equipo

Equipo 3:

- Kevin Andrés Rosales Rodríguez
- Edwin Noé Zaragoza Alvarado
- Nohemí Posada Atayde
- Manuel Ramirez Contreras