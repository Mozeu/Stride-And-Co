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

  if (response.status !== 200 || !response.body || !response.body.data || !response.body.data.token) {
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