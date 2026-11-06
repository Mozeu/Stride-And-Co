## Prompt 1

Analiza el codigo de Stride-And-Co, enfocate mas que nada en las rutas, controladores, modelos, middleware, configuracion, matriz RBAC y los scripts/seed.js. En este momento nos encontramos implementando pruebas E2E con Jest y Supertest, por ende quiero que revises la configuracion que existe y que crees test/e2e/helpers.js con funciones reutilizables para: -Conectarse a la API real a traves de E2E_BASE_URL o config.get('e2e.baseUrl'), -Iniciar sesion con los roles admin, sales y user, -Obtener y utilizar tokens JWT, -Agregar el encabezado Authorization, -Facilitar la creacion y limpieza de datos de prueba. Las contraseñas se obtienen de variables de entorno, no utilices mocks, no modifiques rutas, controladores, modelos ni la logica del backend, no ejecutes comandos destructivos ni uses las bases de produccion, y antes de continuar quiero que me muestres los cambios. Dentro de este proyecto se busca que el codigo sea sencillo y explicito.

### Que genero la IA

### 1. Análisis de la Arquitectura de Stride & Co

#### Rutas y Controladores

- Autenticación (auth.js / auth.js):

  - POST /api/auth/login: Endpoint público. Valida credenciales contra PostgreSQL mediante bcrypt, generando un token JWT firmado con HS256. Responde con { data: { token, tokenType: 'Bearer', expiresIn } }.

  - GET /api/auth/me: Requiere token válido. Retorna el perfil y rol del usuario autenticado.

- Usuarios, Roles y Permisos (users.js, roles.js, permissions.js):

  - Operaciones CRUD protegidas por RBAC. Solo admin puede crear/eliminar usuarios y gestionar roles/permisos. Los usuarios con permiso own pueden consultar o actualizar su propio perfil vía checkOwnership.js.

- Catálogo e Inventario (products.js, variants.js, inventory.js):

  - Rutas de lectura abiertas para admin, sales y user.

  - Modificación y creación restringidas a admin (con actualización de inventario también accesible para sales).

- Clientes y Órdenes (customers.js, orders.js):

  - Almacenadas en MongoDB.

  - Creación y consulta con validación de propiedad (orders:create:own, orders:read:own, etc.) verificando que el cliente pertenezca al userId del token.

---

#### Modelos y Persistencia Híbrida

- PostgreSQL (Sequelize):

  - User: Atributos first_name, last_name, email, active, password_hash, salt_key, role_id.

  - Role y Permission: Relación Many-to-Many mediante tabla intermedia role_permissions.

  - Product, Variant, Inventory: Relación en cascada (Product 1:N Variant 1:1 Inventory).

- MongoDB (Mongoose):

  - Customer: Relaciona userId (referencia numérica al usuario SQL) con direcciones embebidas.

  - Order: Referencia a customerId, montos decimales, items y trazabilidad en statusHistory.

---

#### Middleware

- **authenticate.js**:

  - Intercepta llamadas /api/* (omitiendo POST /api/auth/login).

  - Valida el token con express-jwt y carga en req.user la instancia de Sequelize con su rol y permisos asociados, verificando que el usuario esté activo (user.active === true).

- **authorize.js**:

  - Construye dinámicamente las reglas con la librería accesscontrol a partir de los permisos almacenados en BD.

  - Evalúa primero permisos globales (actionAny). Si no cuenta con ellos, evalúa permisos propios (actionOwn) delegando la comprobación de pertenencia al callback extractor de ID (getOwnerId).

---

#### Configuración y Entornos

- Gestionada mediante el paquete config:

  - default.json: Puerto base 3000 y propiedad e2e.baseUrl: "http://localhost:3000".

  - test.json: Parámetros para pruebas de integración con bases terminadas en _test.

  - jest.e2e.config.js: Configurado para buscar `<rootDir>/test/e2e/****/***.e2e.test.js` con timeout de 30s.

  - package.json: Script "test:e2e": "node --experimental-vm-modules . /node_modules/jest/bin/jest.js --config jest.e2e.config.js --runInBand".

---

#### Matriz RBAC y Seed Scripts

- **seed-rbac.js**:

  - admin: Acceso completo a usuarios, roles, permisos, productos, variantes, inventario, clientes y órdenes.

  - sales: Lectura de usuarios y productos/variantes/inventario; gestión de clientes y órdenes.

  - user: Lectura de productos/variantes y acceso restringido exclusivamente a sus propios datos de cliente y órdenes (read:own, update:own, create:own).

- **seed.js**:

  - Sincroniza la matriz RBAC e inserta los usuarios de prueba base: admin@stride.test, sales@stride.test y user@stride.test.

---

### 2. Archivo Creado: helpers.js

Siguiendo tus requerimientos de mantener un diseño simple, explícito, sin cachés complejas, sin registros globales ni contraseñas predeterminadas:

```js
   'use strict';
   const request = require('supertest');
   const config = require('config');
   /**
    * Obtiene la URL base de la API para las pruebas E2E.
    * Prioriza E2E_BASE_URL sobre config.get('e2e.baseUrl').
    */
   function getBaseUrl() {
     if (process.env.E2E_BASE_URL) {
       return process.env.E2E_BASE_URL.replace(/\/+$/, '');
     }
     if (config.has('e2e.baseUrl')) {
       return config.get('e2e.baseUrl').replace(/\/+$/, '');
     }
     return 'http://localhost:3000';
   }
   /**
    * Crea una instancia de Supertest vinculada a la URL base de la API real.
    */
   function getClient() {
     return request(getBaseUrl());
   }
   /**
    * Obtiene las credenciales del rol desde variables de entorno.
    * Lanza un error si la contraseña no está definida en el entorno.
    */
   function getCredentials(role) {
     const roleKey = role.toUpperCase();
     const email = process.env[`E2E_${roleKey}_EMAIL`] || `${role}@stride.test`;
     const password = process.env[`E2E_${roleKey}_PASSWORD`];
     if (!password) {
       throw new Error(`La variable de entorno E2E_${roleKey}_PASSWORD es obligatoria`);
     }
     return { email, password };
   }
   /**
    * Inicia sesión contra la API real y devuelve el token JWT para el rol especificado.
    * Roles válidos: 'admin', 'sales', 'user'.
    */
   async function loginAs(role) {
     const { email, password } = getCredentials(role);
     const response = await getClient()
       .post('/api/auth/login')
       .send({ email, password });
     if (response.status !== 200 || !response.body || !response.body.data ||
     !response.body.data.token) {
       const errorMsg = response.body && response.body.message
         ? response.body.message
         : `Status ${response.status}`;
       throw new Error(`Fallo de autenticación para el rol "${role}": ${errorMsg}`);
     }
     return response.body.data.token;
   }
   /**
    * Agrega el encabezado Authorization a una petición Supertest.
    */
   function withAuth(requestBuilder, token) {
     return requestBuilder.set('Authorization', `Bearer ${token}`);
   }
   /**
    * Retorna el encabezado Authorization como objeto.
    */
   function authHeader(token) {
     return { Authorization: `Bearer ${token}` };
   }
   /**
    * Funciones explícitas de limpieza para eliminar registros de prueba vía API.
    */
   async function deleteProduct(productId, adminToken) {
     return withAuth(getClient().delete(`/api/products/${productId}`), adminToken);
   }
   async function deleteVariant(variantId, adminToken) {
     return withAuth(getClient().delete(`/api/variants/${variantId}`), adminToken);
   }
   async function deleteCustomer(customerId, adminToken) {
     return withAuth(getClient().delete(`/api/customers/${customerId}`), adminToken);
   }
   async function deleteUser(userId, adminToken) {
     return withAuth(getClient().delete(`/api/users/${userId}`), adminToken);
   }
   module.exports = {
     getBaseUrl,
     getClient,
     getCredentials,
     loginAs,
     withAuth,
     authHeader,
     deleteProduct,
     deleteVariant,
     deleteCustomer,
     deleteUser
   };
```

---

### 3. Aspectos Clave de la Implementación

1. Sin mocks: getClient() conecta Supertest directamente a la URL de la API real mediante llamadas HTTP vivas.

2. Sin contraseñas quemadas: getCredentials(role) exige E2E_ADMIN_PASSWORD, E2E_SALES_PASSWORD o E2E_USER_PASSWORD; si falta la variable, aborta de inmediato con un mensaje explícito.

3. No destructivo: La limpieza se hace vía endpoints DELETE de la propia API usando el token de administrador, sin comandos destructivos directos a las bases de datos.

### Correcciones

No se realizaron grandes cambios de logica, solamente de sintaxis

- Se cambio la expresion de getBaseUrl() por .replace(/\\\\/+$/, '')

- URL predeterminada a return 'http://localhost:3000';

- Normalizacion de caracteres de las cadenas

## Prompt 2

Genera pruebas E2E con Jest y Supertest para estos archivos:

- test/e2e/health.e2e.test.js

- test/e2e/auth.e2e.test.js

- test/e2e/rbac.e2e.test.js

- test/e2e/i18n.e2e.test.js. Quiero que uses unicamente la API real mediante request(baseUrl) y las funciones de helpers.js. Requisitos:

1. GET /health responde 200 y { "status": "UP" }.

2. Login correcto devuelve un JWT.

3. Credenciales incorrectas responden 401.

4. Las rutas protegidas responden 401 sin token o con token inválido.

5. ADMIN puede eliminar productos.

6. SALES no puede eliminar productos: 403.

7. USER puede consultar su propia orden.

8. USER no puede consultar órdenes ajenas: 403.

9. USER no puede listar todas las órdenes: 403. Es necesario que consultes el codigo real antes de generar las pruebas, ademas de limpiar exclusivamente los registros de cada prueba, sin usar mocks ni modificar el backend. Recuerda que el codigo debe ser sencillo, simplemente cumplir con lo que se solicita, ser legile y explicito.

### Que genero la IA

Se han generado las pruebas E2E solicitadas utilizando únicamente Jest, Supertest (request(baseUrl)) y las funciones de helpers.js, sin mocks y sin alterar el backend:

### 1. health.e2e.test.js

- Requisito 1: Verifica que GET /health responde con código 200 y cuerpo { "status": "UP" }.

```js
 'use strict';
const request = require('supertest');
const { getBaseUrl } = require('./helpers');
describe('E2E Health', () => {
 const baseUrl = getBaseUrl();
 test('GET /health responde 200 y { "status": "UP" }', async () => {
   const response = await request(baseUrl).get('/health');
   expect(response.status).toBe(200);
   expect(response.body).toEqual({ status: 'UP' });
 });
});
```

### 2. auth.e2e.test.js

- Requisito 2: Login correcto devuelve un token JWT en la respuesta.

- Requisito 3: Credenciales incorrectas responden con status 401.

- Requisito 4: Rutas protegidas (GET /api/auth/me) responden con status 401 sin token o con token inválido.

```js
 'use strict';
const request = require('supertest');
const { getBaseUrl, getCredentials } = require('./helpers');
describe('E2E Auth', () => {
 const baseUrl = getBaseUrl();
 test('Login correcto devuelve un JWT', async () => {
   const credentials = getCredentials('admin');
   const response = await request(baseUrl)
     .post('/api/auth/login')
     .send(credentials);
   expect(response.status).toBe(200);
   expect(response.body).toHaveProperty('data');
   expect(response.body.data.token).toBeDefined();
   expect(typeof response.body.data.token).toBe('string');
 });
 test('Credenciales incorrectas responden 401', async () => {
   const response = await request(baseUrl)
     .post('/api/auth/login')
     .send({
       email: 'inexistente@stride.test',
       password: 'PasswordIncorrecto123!'
     });
   expect(response.status).toBe(401);
 });
 test('Las rutas protegidas responden 401 sin token o con token inválido', async () => {
   const responseWithoutToken = await request(baseUrl)
     .get('/api/auth/me');
   expect(responseWithoutToken.status).toBe(401);
   const responseWithInvalidToken = await request(baseUrl)
     .get('/api/auth/me')
     .set('Authorization', 'Bearer token_invalido');
   expect(responseWithInvalidToken.status).toBe(401);
 });
});
```

### 3. rbac.e2e.test.js

- Requisito 5: Rol ADMIN puede eliminar productos creados durante la prueba (deleteProduct).

- Requisito 6: Rol SALES recibe 403 al intentar eliminar productos (y el producto se limpia en bloque finally).

- Requisito 7: Rol USER puede consultar su propia orden (GET /api/orders/:id responde 200).

- Requisito 8: Rol USER no puede consultar órdenes ajenas (GET /api/orders/:id responde 403).

- Requisito 9: Rol USER no puede listar todas las órdenes (GET /api/orders responde 403).

```js
 'use strict';
const request = require('supertest');
const { getBaseUrl, loginAs, authHeader, deleteProduct } = require('./helpers');
describe('E2E RBAC', () => {
 const baseUrl = getBaseUrl();
 let adminToken;
 let salesToken;
 let userToken;
 let ownOrder;
 let foreignOrder;
 beforeAll(async () => {
   adminToken = await loginAs('admin');
   salesToken = await loginAs('sales');
   userToken = await loginAs('user');
   const userProfileRes = await request(baseUrl)
     .get('/api/auth/me')
     .set(authHeader(userToken));
   const userId = userProfileRes.body.id;
   const userEmail = userProfileRes.body.email;
   const ordersRes = await request(baseUrl)
     .get('/api/orders')
     .set(authHeader(adminToken));
   const orders = ordersRes.body.data || [];
   ownOrder = orders.find(
     (order) => order.customerId && (order.customerId.userId === userId || order.customerId.email === userEmail)
   );
   foreignOrder = orders.find(
     (order) => order.customerId && order.customerId.userId !== userId && order.customerId.email !== userEmail
   );
 });
 test('ADMIN puede eliminar productos', async () => {
   const createRes = await request(baseUrl)
     .post('/api/products')
     .set(authHeader(adminToken))
     .send({
       name: 'Producto Temp Admin E2E',
       price: 199.99
     });
   expect(createRes.status).toBe(201);
   const productId = createRes.body.data.id;
   const deleteRes = await deleteProduct(productId, adminToken);
   expect(deleteRes.status).toBe(200);
 });
 test('SALES no puede eliminar productos: 403', async () => {
   const createRes = await request(baseUrl)
     .post('/api/products')
     .set(authHeader(adminToken))
     .send({
       name: 'Producto Temp Sales E2E',
       price: 199.99
     });
   expect(createRes.status).toBe(201);
   const productId = createRes.body.data.id;
   try {
     const deleteRes = await request(baseUrl)
       .delete(`/api/products/${productId}`)
       .set(authHeader(salesToken));
     expect(deleteRes.status).toBe(403);
   } finally {
     await deleteProduct(productId, adminToken);
   }
 });
 test('USER puede consultar su propia orden', async () => {
   expect(ownOrder).toBeDefined();
   const response = await request(baseUrl)
     .get(`/api/orders/${ownOrder._id}`)
     .set(authHeader(userToken));
   expect(response.status).toBe(200);
   expect(response.body).toHaveProperty('data');
   expect(response.body.data._id).toBe(ownOrder._id);
 });
 test('USER no puede consultar órdenes ajenas: 403', async () => {
   expect(foreignOrder).toBeDefined();
   const response = await request(baseUrl)
     .get(`/api/orders/${foreignOrder._id}`)
     .set(authHeader(userToken));
   expect(response.status).toBe(403);
 });
 test('USER no puede listar todas las órdenes: 403', async () => {
   const response = await request(baseUrl)
     .get('/api/orders')
     .set(authHeader(userToken));
   expect(response.status).toBe(403);
 });
});
```

### 4. i18n.e2e.test.js

- Verifica la traducción de respuestas y mensajes de error según el encabezado Accept- Language (es y en) en listados de productos, validación de login y respuestas no autorizadas.

```js
 'use strict';
const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');
describe('E2E i18n', () => {
 const baseUrl = getBaseUrl();
 let userToken;
 beforeAll(async () => {
   userToken = await loginAs('user');
 });
 test('responde en español cuando Accept-Language es es', async () => {
   const response = await request(baseUrl)
     .get('/api/products')
     .set(authHeader(userToken))
     .set('Accept-Language', 'es');
   expect(response.status).toBe(200);
   expect(response.body.message).toBe('Lista de Productos');
 });
 test('responde en inglés cuando Accept-Language es en', async () => {
   const response = await request(baseUrl)
     .get('/api/products')
     .set(authHeader(userToken))
     .set('Accept-Language', 'en');
   expect(response.status).toBe(200);
   expect(response.body.message).toBe('Products List');
 });
 test('traduce errores de validación según el idioma solicitado', async () => {
   const esResponse = await request(baseUrl)
     .post('/api/auth/login')
     .set('Accept-Language', 'es')
     .send({});
   expect(esResponse.status).toBe(400);
   expect(esResponse.body.message).toBe('Se requieren email y contraseña');
   const enResponse = await request(baseUrl)
     .post('/api/auth/login')
     .set('Accept-Language', 'en')
     .send({});
   expect(enResponse.status).toBe(400);
   expect(enResponse.body.message).toBe('Email and password are required');
 });
 test('traduce errores de autenticación según el idioma solicitado', async () => {
   const esResponse = await request(baseUrl)
     .get('/api/auth/me')
     .set('Accept-Language', 'es');
   expect(esResponse.status).toBe(401);
   expect(esResponse.body.message).toBe('No Autorizado');
   const enResponse = await request(baseUrl)
     .get('/api/auth/me')
     .set('Accept-Language', 'en');
   expect(enResponse.status).toBe(401);
   expect(enResponse.body.message).toBe('Unauthorized');
 });
});
```

### Correcciones

Aqui no se hizo ninguna correcion, ya que no hubo detalles o problemas en la ejecucion de pruebas.

## Prompt 3

Genera las siguientes pruebas E2E utilizando Jest, Supertest y la API real:

- test/e2e/users.e2e.test.js

- test/e2e/roles.e2e.test.js

- test/e2e/permissions.e2e.test.js. Necesito que primero revises las rutas, controladores, modelos y permisos RBAC reales, luego, para cada recurso prueba: -Crear -Consultar por ID -Listar -Actualizar -Eliminar -Verificar que el recurso eliminado ya no exista -validar datos incorrectos -Comprobar codigos HTTP. Quiero que para los usuarios verifiques que las respuestas no expongan password_hash ni salt_key. Usa un admin autenticado y prueba casos de acceso denegado, genera datos unicos para las pruebas y unicamente limpia los registros generados por las suites. Todo esto sin alterar roles y permisos de demo, sin usar mocks ni modificar el backend. Recuerda que el codigo tiene que cumplir simplemente con lo que se necesita para que funcione correctamente, ser sencillo, legible y explicito

### Que genero la IA

Se han generado las pruebas E2E solicitadas en los archivos users.e2e.test.js, roles.e2e.test.js y permissions.e2e.test.js utilizando Jest, Supertest y la API real, sin utilizar mocks y sin modificar el código del backend ni alterar los datos/roles demo.

---

### 1. Resumen de Análisis Técnico

- Rutas y Controladores:

  - users: users.js y users.js. La creación y eliminación requieren users:create:any y users:delete:any (exclusivo de admin). El listado requiere users:read:any (denegado a user).

  - roles: roles.js y roles.js. Todas las operaciones CRUD requieren permisos con alcance :any, exclusivos de admin.

  - permissions: permissions.js y permissions.js. Todas las operaciones CRUD son de uso exclusivo para admin.

- Protección de Credenciales (Usuarios):

  - En User.js, User.prototype.toJSON elimina password_hash y salt_key. Se verificó mediante aserciones que ninguna respuesta (POST, GET :id, GET listado, PUT) exponga dichos campos.

- Manejo de Respuestas y Eliminación:

  - Cuando un recurso no existe o fue eliminado, las consultas por ID retornan 200 con data: null, y las actualizaciones de IDs no existentes retornan 404 Not Found.

---

### 2. Suites Implementadas

#### users.e2e.test.js

- Control de acceso:

  - 401 Unauthorized ante peticiones sin token.

  - 403 Forbidden ante intentos de listar, crear o eliminar usuarios con rol user.

- Operaciones con Admin:

  - Crear: POST /api/users responde 201, retorna el usuario creado con email único (user_e2e_<timestamp>@stride.test) y valida que password_hash y salt_key sean undefined.

  - Consultar por ID: GET /api/users/:id responde 200 y valida ausencia de password_hash y salt_key.

  - Listar: GET /api/users responde 200, confirma la presencia del registro creado y valida que ningún usuario del arreglo exponga hashes ni salts.

  - Actualizar: PUT /api/users/:id responde 200 y verifica campos actualizados sin exponer hashes ni salts.

  - Validar datos incorrectos / Recurso no encontrado: PUT /api/users/999999 responde 404 Not Found.

  - Eliminar: DELETE /api/users/:id responde 200.

  - Verificación de eliminación: GET /api/users/:id retorna data: null y PUT /api/users/:id responde 404 Not Found.

  - Limpieza: hook afterAll explícito para limpiar únicamente el ID generado si persiste.

```js
     'use strict';
const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');
describe('E2E Users', () => {
 const baseUrl = getBaseUrl();
 let adminToken;
 let userToken;
 let createdUserId;
 beforeAll(async () => {
   adminToken = await loginAs('admin');
   userToken = await loginAs('user');
 });
 afterAll(async () => {
   if (createdUserId) {
     await request(baseUrl)
       .delete(`/api/users/${createdUserId}`)
       .set(authHeader(adminToken));
   }
 });
 describe('Control de acceso (Autenticación y RBAC)', () => {
   test('Petición sin token responde 401 Unauthorized', async () => {
     const res = await request(baseUrl).get('/api/users');
     expect(res.status).toBe(401);
   });
   test('Usuario sin permisos suficientes responde 403 Forbidden al listar usuarios', async () => {
     const res = await request(baseUrl)
       .get('/api/users')
       .set(authHeader(userToken));
     expect(res.status).toBe(403);
   });
   test('Usuario sin permisos suficientes responde 403 Forbidden al crear usuario', async () => {
     const res = await request(baseUrl)
       .post('/api/users')
       .set(authHeader(userToken))
       .send({
         name: 'Forbidden',
         lastName: 'User',
         email: `forbidden_${Date.now()}@stride.test`,
         password: 'Password123!'
       });
     expect(res.status).toBe(403);
   });
   test('Usuario sin permisos suficientes responde 403 Forbidden al eliminar usuario', async () => {
     const res = await request(baseUrl)
       .delete('/api/users/1')
       .set(authHeader(userToken));
     expect(res.status).toBe(403);
   });
 });
 describe('Operaciones CRUD y validaciones con Admin', () => {
   test('Crear usuario (POST /api/users) responde 201 y no expone password_hash ni salt_key', async () => {
     const uniqueEmail = `user_e2e_${Date.now()}@stride.test`;
     const res = await request(baseUrl)
       .post('/api/users')
       .set(authHeader(adminToken))
       .send({
         name: 'E2E_First',
         lastName: 'E2E_Last',
         email: uniqueEmail,
         password: 'SecurePassword123!'
       });
     expect(res.status).toBe(201);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data).toHaveProperty('id');
     expect(res.body.data.email).toBe(uniqueEmail);
     // Verificación de seguridad: no exponer credenciales
     expect(res.body.data.password_hash).toBeUndefined();
     expect(res.body.data.salt_key).toBeUndefined();
     createdUserId = res.body.data.id;
   });
   test('Consultar usuario por ID (GET /api/users/:id) responde 200 y no expone password_hash ni salt_key', async () => {
     expect(createdUserId).toBeDefined();
     const res = await request(baseUrl)
       .get(`/api/users/${createdUserId}`)
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data.id).toBe(createdUserId);
     // Verificación de seguridad
     expect(res.body.data.password_hash).toBeUndefined();
     expect(res.body.data.salt_key).toBeUndefined();
   });
   test('Listar usuarios (GET /api/users) responde 200 y ninguna entrada expone password_hash ni salt_key', async () => {
     const res = await request(baseUrl)
       .get('/api/users')
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(Array.isArray(res.body.data)).toBe(true);
     const found = res.body.data.find((u) => u.id === createdUserId);
     expect(found).toBeDefined();
     // Verificar en toda la lista que no se expongan hashes ni salts
     res.body.data.forEach((user) => {
       expect(user.password_hash).toBeUndefined();
       expect(user.salt_key).toBeUndefined();
     });
   });
   test('Actualizar usuario (PUT /api/users/:id) responde 200 y no expone password_hash ni salt_key', async () => {
     expect(createdUserId).toBeDefined();
     const updatedName = 'E2E_Updated_First';
     const res = await request(baseUrl)
       .put(`/api/users/${createdUserId}`)
       .set(authHeader(adminToken))
       .send({
         name: updatedName
       });
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data.first_name).toBe(updatedName);
     // Verificación de seguridad
     expect(res.body.data.password_hash).toBeUndefined();
     expect(res.body.data.salt_key).toBeUndefined();
   });
   test('Actualizar usuario inexistente responde 404 Not Found', async () => {
     const res = await request(baseUrl)
       .put('/api/users/999999')
       .set(authHeader(adminToken))
       .send({
         name: 'NonExistent'
       });
     expect(res.status).toBe(404);
   });
   test('Eliminar usuario (DELETE /api/users/:id) responde 200', async () => {
     expect(createdUserId).toBeDefined();
     const res = await request(baseUrl)
       .delete(`/api/users/${createdUserId}`)
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
   });
   test('Verificar que el usuario eliminado ya no existe', async () => {
     expect(createdUserId).toBeDefined();
     // Al consultar por ID, el recurso eliminado retorna data null
     const getRes = await request(baseUrl)
       .get(`/api/users/${createdUserId}`)
       .set(authHeader(adminToken));
     expect(getRes.status).toBe(200);
     expect(getRes.body.data).toBeNull();
     // Al intentar actualizar un usuario que ya no existe, responde 404
     const putRes = await request(baseUrl)
       .put(`/api/users/${createdUserId}`)
       .set(authHeader(adminToken))
       .send({ name: 'ShouldFail' });
     expect(putRes.status).toBe(404);
     // Limpiar variable para que afterAll no intente borrarlo nuevamente
     createdUserId = null;
   });
 });
});
```

#### roles.e2e.test.js

- Control de acceso:

  - 401 Unauthorized sin token.

  - 403 Forbidden al listar, crear o eliminar con rol user.

- Operaciones con Admin:

  - Crear: POST /api/roles responde 201 con nombre único (role_e2e_<timestamp>).

  - Consultar por ID: GET /api/roles/:id responde 200 con el rol esperado.

  - Listar: GET /api/roles responde 200 e incluye el nuevo rol.

  - Actualizar: PUT /api/roles/:id responde 200 con la descripción modificada.

  - Validar datos incorrectos: POST /api/roles con name: '' responde 500 (error de validación Sequelize capturado por el controlador); PUT /api/roles/999999 responde 404 Not Found.

  - Eliminar: DELETE /api/roles/:id responde 200.

  - Verificación de eliminación: GET /api/roles/:id retorna data: null y PUT /api/roles/:id responde 404 Not Found.

  - Limpieza: hook afterAll que remueve exclusivamente el rol de prueba.

```js
   'use strict';
const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');
describe('E2E Roles', () => {
 const baseUrl = getBaseUrl();
 let adminToken;
 let userToken;
 let createdRoleId;
 beforeAll(async () => {
   adminToken = await loginAs('admin');
   userToken = await loginAs('user');
 });
 afterAll(async () => {
   if (createdRoleId) {
     await request(baseUrl)
       .delete(`/api/roles/${createdRoleId}`)
       .set(authHeader(adminToken));
   }
 });
 describe('Control de acceso (Autenticación y RBAC)', () => {
   test('Petición sin token responde 401 Unauthorized', async () => {
     const res = await request(baseUrl).get('/api/roles');
     expect(res.status).toBe(401);
   });
   test('Usuario sin permisos responde 403 Forbidden al listar roles', async () => {
     const res = await request(baseUrl)
       .get('/api/roles')
       .set(authHeader(userToken));
     expect(res.status).toBe(403);
   });
   test('Usuario sin permisos responde 403 Forbidden al crear rol', async () => {
     const res = await request(baseUrl)
       .post('/api/roles')
       .set(authHeader(userToken))
       .send({ name: `forbidden_role_${Date.now()}` });
     expect(res.status).toBe(403);
   });
   test('Usuario sin permisos responde 403 Forbidden al eliminar rol', async () => {
     const res = await request(baseUrl)
       .delete('/api/roles/1')
       .set(authHeader(userToken));
     expect(res.status).toBe(403);
   });
 });
 describe('Operaciones CRUD y validaciones con Admin', () => {
   test('Crear rol (POST /api/roles) responde 201', async () => {
     const uniqueRoleName = `role_e2e_${Date.now()}`;
     const res = await request(baseUrl)
       .post('/api/roles')
       .set(authHeader(adminToken))
       .send({
         name: uniqueRoleName,
         description: 'Rol creado para prueba E2E'
       });
     expect(res.status).toBe(201);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data).toHaveProperty('id');
     expect(res.body.data.name).toBe(uniqueRoleName);
     createdRoleId = res.body.data.id;
   });
   test('Consultar rol por ID (GET /api/roles/:id) responde 200', async () => {
     expect(createdRoleId).toBeDefined();
     const res = await request(baseUrl)
       .get(`/api/roles/${createdRoleId}`)
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data.id).toBe(createdRoleId);
   });
   test('Listar roles (GET /api/roles) responde 200', async () => {
     const res = await request(baseUrl)
       .get('/api/roles')
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(Array.isArray(res.body.data)).toBe(true);
     const found = res.body.data.find((r) => r.id === createdRoleId);
     expect(found).toBeDefined();
   });
   test('Actualizar rol (PUT /api/roles/:id) responde 200', async () => {
     expect(createdRoleId).toBeDefined();
     const updatedDesc = 'Descripcion actualizada E2E';
     const res = await request(baseUrl)
       .put(`/api/roles/${createdRoleId}`)
       .set(authHeader(adminToken))
       .send({
         description: updatedDesc
       });
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data.description).toBe(updatedDesc);
   });
   test('Validar datos incorrectos al crear rol responde 500 (SequelizeValidationError)', async () => {
     const res = await request(baseUrl)
       .post('/api/roles')
       .set(authHeader(adminToken))
       .send({
         name: ''
       });
     expect(res.status).toBe(500);
   });
   test('Actualizar rol inexistente responde 404 Not Found', async () => {
     const res = await request(baseUrl)
       .put('/api/roles/999999')
       .set(authHeader(adminToken))
       .send({
         name: 'NonExistentRole'
       });
     expect(res.status).toBe(404);
   });
   test('Eliminar rol (DELETE /api/roles/:id) responde 200', async () => {
     expect(createdRoleId).toBeDefined();
     const res = await request(baseUrl)
       .delete(`/api/roles/${createdRoleId}`)
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
   });
   test('Verificar que el rol eliminado ya no existe', async () => {
     expect(createdRoleId).toBeDefined();
     // Al consultar por ID, el rol eliminado retorna data null
     const getRes = await request(baseUrl)
       .get(`/api/roles/${createdRoleId}`)
       .set(authHeader(adminToken));
     expect(getRes.status).toBe(200);
     expect(getRes.body.data).toBeNull();
     // Al intentar actualizar un rol eliminado, responde 404
     const putRes = await request(baseUrl)
       .put(`/api/roles/${createdRoleId}`)
       .set(authHeader(adminToken))
       .send({ description: 'ShouldFail' });
     expect(putRes.status).toBe(404);
     createdRoleId = null;
   });
 });
});
```

#### permissions.e2e.test.js

- Control de acceso:

  - 401 Unauthorized sin token.

  - 403 Forbidden al listar, crear o eliminar con rol user.

- Operaciones con Admin:

  - Crear: POST /api/permissions responde 201 con clave única (e2e:test:<timestamp>).

  - Consultar por ID: GET /api/permissions/:id responde 200.

  - Listar: GET /api/permissions responde 200 conteniendo el permiso creado.

  - Actualizar: PUT /api/permissions/:id responde 200 con la descripción actualizada.

  - Validar datos incorrectos / rutas: GET /api/permissions/999999 responde 200 con data: null; GET /api/permissions/inexistente/subruta responde 404 Not Found.

  - Eliminar: DELETE /api/permissions/:id responde 200.

  - Verificación de eliminación: GET /api/permissions/:id retorna data: null.

  - Limpieza: hook afterAll que remueve exclusivamente el permiso de prueba.

```js
'use strict';
const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');
describe('E2E Permissions', () => {
 const baseUrl = getBaseUrl();
 let adminToken;
 let userToken;
 let createdPermissionId;
 beforeAll(async () => {
   adminToken = await loginAs('admin');
   userToken = await loginAs('user');
 });
 afterAll(async () => {
   if (createdPermissionId) {
     await request(baseUrl)
       .delete(`/api/permissions/${createdPermissionId}`)
       .set(authHeader(adminToken));
   }
 });
 describe('Control de acceso (Autenticación y RBAC)', () => {
   test('Petición sin token responde 401 Unauthorized', async () => {
     const res = await request(baseUrl).get('/api/permissions');
     expect(res.status).toBe(401);
   });
   test('Usuario sin permisos responde 403 Forbidden al listar permisos', async () => {
     const res = await request(baseUrl)
       .get('/api/permissions')
       .set(authHeader(userToken));
     expect(res.status).toBe(403);
   });
   test('Usuario sin permisos responde 403 Forbidden al crear permiso', async () => {
     const res = await request(baseUrl)
       .post('/api/permissions')
       .set(authHeader(userToken))
       .send({
         key: `forbidden:perm:${Date.now()}`,
         description: 'Forbidden test'
       });
     expect(res.status).toBe(403);
   });
   test('Usuario sin permisos responde 403 Forbidden al eliminar permiso', async () => {
     const res = await request(baseUrl)
       .delete('/api/permissions/1')
       .set(authHeader(userToken));
     expect(res.status).toBe(403);
   });
 });
 describe('Operaciones CRUD y validaciones con Admin', () => {
   test('Crear permiso (POST /api/permissions) responde 201', async () => {
     const uniqueKey = `e2e:test:${Date.now()}`;
     const res = await request(baseUrl)
       .post('/api/permissions')
       .set(authHeader(adminToken))
       .send({
         key: uniqueKey,
         description: 'Permiso creado para prueba E2E'
       });
     expect(res.status).toBe(201);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data).toHaveProperty('id');
     expect(res.body.data.key).toBe(uniqueKey);
     createdPermissionId = res.body.data.id;
   });
   test('Consultar permiso por ID (GET /api/permissions/:id) responde 200', async () => {
     expect(createdPermissionId).toBeDefined();
     const res = await request(baseUrl)
       .get(`/api/permissions/${createdPermissionId}`)
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data.id).toBe(createdPermissionId);
   });
   test('Listar permisos (GET /api/permissions) responde 200', async () => {
     const res = await request(baseUrl)
       .get('/api/permissions')
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(Array.isArray(res.body.data)).toBe(true);
     const found = res.body.data.find((p) => p.id === createdPermissionId);
     expect(found).toBeDefined();
   });
   test('Actualizar permiso (PUT /api/permissions/:id) responde 200', async () => {
     expect(createdPermissionId).toBeDefined();
     const updatedDesc = 'Descripcion actualizada E2E';
     const res = await request(baseUrl)
       .put(`/api/permissions/${createdPermissionId}`)
       .set(authHeader(adminToken))
       .send({
         description: updatedDesc
       });
     expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('data');
     expect(res.body.data.description).toBe(updatedDesc);
   });
   test('Consultar permiso inexistente responde 200 con data null', async () => {
     const res = await request(baseUrl)
       .get('/api/permissions/999999')
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
     expect(res.body.data).toBeNull();
   });
   test('Consultar subruta inexistente en permisos responde 404 Not Found', async () => {
     const res = await request(baseUrl)
       .get('/api/permissions/inexistente/subruta')
       .set(authHeader(adminToken));
     expect(res.status).toBe(404);
   });
   test('Eliminar permiso (DELETE /api/permissions/:id) responde 200', async () => {
     expect(createdPermissionId).toBeDefined();
     const res = await request(baseUrl)
       .delete(`/api/permissions/${createdPermissionId}`)
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
   });
   test('Verificar que el permiso eliminado ya no existe', async () => {
     expect(createdPermissionId).toBeDefined();
     const res = await request(baseUrl)
       .get(`/api/permissions/${createdPermissionId}`)
       .set(authHeader(adminToken));
     expect(res.status).toBe(200);
     expect(res.body.data).toBeNull();
     createdPermissionId = null;
   });
 });
});
```

---

### 3. Ejecución de Pruebas

Para ejecutar las pruebas E2E contra la API real:

```bash
E2E_ADMIN_PASSWORD="DemoAdmin!2026" \
E2E_SALES_PASSWORD="DemoSales!2026" \
E2E_USER_PASSWORD="DemoUser!2026" \
npm run test:e2e
```

Resultado de ejecución:

- 7 suites pasadas (48 pruebas en total, 0 fallos).

- Linter sin errores (0 errors).

### Correciones

npm run test:e2e arrojaba error a 45 pruebas debido a "La variable de entorno E2E_ADMIN_PASSWORD es obligatoria"

Entonces configuramos los correos en el bash de la raiz del proyecto

```bash
export E2E_ADMIN_EMAIL='admin@stride.test'
export E2E_SALES_EMAIL='sales@stride.test'
export E2E_USER_EMAIL='user@stride.test'
read -r -s -p 'Contraseña de admin/sales/user: ' E2E_ADMIN_PASSWORD
echo
export E2E_ADMIN_PASSWORD
```

Nota: Se usan las contrasenas demo
