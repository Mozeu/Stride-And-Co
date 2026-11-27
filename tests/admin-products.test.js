jest.unmock('../middleware/authorize');

const request = require('supertest');
const app = require('../app');
const { signToken } = require('../services/auth.service');
const { User } = require('../models/sql');
const productsService = require('../services/products.service');

const manage = [
  'products:read:any', 'products:update:any', 'products:create:any', 'products:delete:any'
];

// Simula una sesión con la cookie access_token y los permisos indicados
function as(method, path, keys) {
  User.findByPk.mockResolvedValueOnce({
    id: 1,
    active: true,
    first_name: 'Admin',
    role: { name: 'admin', permissions: keys.map(key => ({ key })) }
  });
  return request(app)[method](path).set('Cookie', 'access_token=' + signToken({ id: 1 }));
}

const sample = {
  id: 7,
  name: 'Stride Runner X',
  brand: 'Stride',
  description: 'Zapatilla',
  price: '1899.00',
  category_id: 1,
  active: true,
  variants: []
};

const validForm = {
  name: 'Runner X',
  brand: 'Stride',
  description: 'Ligera',
  price: '1899,50',
  category_id: '1',
  active: 'on'
};

describe('F8 administración de productos', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('acceso', () => {
    test('redirige a /login conservando la URL cuando no hay sesión', async () => {
      const spy = jest.spyOn(productsService, 'adminList');
      await request(app).get('/admin/products?lang=en')
        .expect(302)
        .expect('Location', '/login?returnTo=' + encodeURIComponent('/admin/products?lang=en'))
        .expect('Cache-Control', 'private, no-store');
      expect(spy).not.toHaveBeenCalled();
    });

    test('redirige a /login en los POST sin sesión', async () => {
      const spy = jest.spyOn(productsService, 'create');
      await request(app).post('/admin/products').type('form').send(validForm).expect(302);
      expect(spy).not.toHaveBeenCalled();
    });

    test('un cliente con solo products:read:any recibe 403 y no ve productos inactivos', async () => {
      const spy = jest.spyOn(productsService, 'adminList');
      const response = await as('get', '/admin/products?lang=en', ['products:read:any'])
        .expect(403)
        .expect('Content-Type', /text\/html/);
      expect(response.text).toContain('Access denied');
      expect(spy).not.toHaveBeenCalled();
    });

    test('sin products:create:any no se puede abrir el formulario ni crear', async () => {
      const spy = jest.spyOn(productsService, 'create');
      await as('get', '/admin/products/new', ['products:read:any', 'products:update:any']).expect(403);
      await as('post', '/admin/products', ['products:read:any', 'products:update:any'])
        .type('form').send(validForm).expect(403);
      expect(spy).not.toHaveBeenCalled();
    });

    test('sin products:delete:any no se puede eliminar', async () => {
      const spy = jest.spyOn(productsService, 'remove');
      await as('post', '/admin/products/7/delete', ['products:read:any', 'products:update:any']).expect(403);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('listado', () => {
    test('muestra los productos en el HTML, escapados, con título y meta description', async () => {
      jest.spyOn(productsService, 'adminList').mockResolvedValueOnce({
        products: [
          { ...sample, name: '<Runner>' },
          { ...sample, id: 8, name: 'Oculto', active: false }
        ],
        currentPage: 1,
        totalPages: 1
      });

      const response = await as('get', '/admin/products?lang=es', manage)
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect('Cache-Control', 'private, no-store');

      expect(response.text).toContain('<html lang="es">');
      expect(response.text).toContain('<title>Administración de productos | Stride &amp; Co</title>');
      expect(response.text).toContain('<meta name="description"');
      expect(response.text).toContain('class="admin-sidebar"');
      expect(response.text).toContain('class="admin-main"');
      expect(response.text).toContain('aria-current="page"');
      expect(response.text).toContain('A. Productos');
      expect(response.text).toContain('&lt;Runner&gt;');
      expect(response.text).not.toContain('<Runner>');
      expect(response.text).toContain('Activo');
      expect(response.text).toContain('Inactivo');
      expect(response.text).toContain('Activar');
      expect(response.text).toContain('Desactivar');
      expect(response.text).toContain('href="/admin/products/new"');
      expect(response.text.indexOf('href="/admin/products/new"'))
        .toBeLessThan(response.text.indexOf('class="store-panel admin-data-panel'));
      expect(response.text).toContain('href="/admin/products/7/edit"');
      expect(response.text).not.toContain('password_hash');
      expect(response.text).not.toContain('salt_key');
    });

    test('oculta los botones de los que el usuario no tiene permiso', async () => {
      jest.spyOn(productsService, 'adminList').mockResolvedValueOnce({
        products: [sample], currentPage: 1, totalPages: 1
      });

      const response = await as('get', '/admin/products?lang=en', ['products:read:any', 'products:update:any'])
        .expect(200);
      expect(response.text).toContain('/admin/products/7/edit');
      expect(response.text).not.toContain('href="/admin/products/new"');
      expect(response.text).not.toContain('/admin/products/7/delete');
    });

    test('muestra el estado vacío en inglés', async () => {
      jest.spyOn(productsService, 'adminList').mockResolvedValueOnce({
        products: [], currentPage: 1, totalPages: 1
      });

      const response = await as('get', '/admin/products?lang=en', manage).expect(200);
      expect(response.text).toContain('<html lang="en">');
      expect(response.text).toContain('No matching products.');
    });

    test('envía búsqueda y página al servicio y conserva los filtros en la paginación', async () => {
      const spy = jest.spyOn(productsService, 'adminList').mockResolvedValueOnce({
        products: [sample], currentPage: 2, totalPages: 3
      });

      const response = await as('get', '/admin/products?lang=en&q=runner&page=2', manage).expect(200);
      expect(spy).toHaveBeenCalledWith({ q: 'runner', page: 2 });
      expect(response.text).toContain('q=runner');
      expect(response.text).toContain('page=3');
    });

    test('responde con una página 500 segura si falla la consulta', async () => {
      jest.spyOn(productsService, 'adminList').mockRejectedValueOnce(new Error('private SQL details'));

      const response = await as('get', '/admin/products?lang=en', manage).expect(500);
      expect(response.text).toContain('Something went wrong');
      expect(response.text).not.toContain('private SQL details');
    });
  });

  describe('crear', () => {
    test('GET /admin/products/new muestra el formulario vacío', async () => {
      const response = await as('get', '/admin/products/new?lang=es', manage).expect(200);
      expect(response.text).toContain('class="admin-sidebar"');
      expect(response.text).toContain('class="admin-main"');
      expect(response.text).toContain('Nuevo producto');
      expect(response.text).toContain('action="/admin/products"');
      expect(response.text).toContain('Crear producto');
    });

    test('POST inválido responde 400 con errores traducidos y valores capturados', async () => {
      const spy = jest.spyOn(productsService, 'create');

      const response = await as('post', '/admin/products?lang=en', manage)
        .type('form')
        .send({ name: '   ', brand: 'Marca capturada', price: 'abc', category_id: '99' })
        .expect(400)
        .expect('Content-Type', /text\/html/);

      expect(response.text).toContain('Name is required.');
      expect(response.text).toContain('Enter a valid price');
      expect(response.text).toContain('Select a valid category.');
      expect(response.text).toContain('value="Marca capturada"');
      expect(spy).not.toHaveBeenCalled();
    });

    test('rechaza precios negativos o con demasiados decimales', async () => {
      const spy = jest.spyOn(productsService, 'create');
      await as('post', '/admin/products', manage).type('form')
        .send({ ...validForm, price: '-5' }).expect(400);
      await as('post', '/admin/products', manage).type('form')
        .send({ ...validForm, price: '10.999' }).expect(400);
      expect(spy).not.toHaveBeenCalled();
    });

    test('POST válido guarda, redirige (PRG) y deja el mensaje de confirmación', async () => {
      const spy = jest.spyOn(productsService, 'create').mockResolvedValueOnce({ id: 9 });

      const response = await as('post', '/admin/products?lang=es', manage)
        .type('form').send(validForm)
        .expect(302)
        .expect('Location', '/admin/products');

      expect(spy).toHaveBeenCalledWith({
        name: 'Runner X',
        brand: 'Stride',
        description: 'Ligera',
        price: '1899.50',
        category_id: 1,
        active: true
      });
      expect(response.headers['set-cookie'].join()).toContain('admin.products.created');
    });

    test('el checkbox sin marcar guarda el producto como inactivo y sin categoría', async () => {
      const spy = jest.spyOn(productsService, 'create').mockResolvedValueOnce({ id: 9 });
      await as('post', '/admin/products', manage).type('form')
        .send({ name: 'Mochila', price: '350', category_id: '' }).expect(302);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        active: false, category_id: null, brand: null, description: null
      }));
    });
  });

  describe('editar', () => {
    test('GET /admin/products/:id/edit muestra el formulario con los datos', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce(sample);

      const response = await as('get', '/admin/products/7/edit?lang=en', manage).expect(200);
      expect(response.text).toContain('Edit product');
      expect(response.text).toContain('action="/admin/products/7"');
      expect(response.text).toContain('value="Stride Runner X"');
      expect(response.text).toContain('value="1899.00"');
    });

    test('responde 404 si el producto no existe o el id no es válido', async () => {
      const find = jest.spyOn(productsService, 'find').mockResolvedValueOnce(null);

      const missing = await as('get', '/admin/products/999/edit?lang=en', manage).expect(404);
      expect(missing.text).toContain('Page not found');

      await as('get', '/admin/products/abc/edit', manage).expect(404);
      expect(find).toHaveBeenCalledTimes(1);
    });

    test('POST inválido responde 400 y conserva lo escrito', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce(sample);
      const update = jest.spyOn(productsService, 'update');

      const response = await as('post', '/admin/products/7?lang=es', manage)
        .type('form').send({ name: '', price: '12', brand: 'Otra marca' })
        .expect(400);
      expect(response.text).toContain('El nombre es obligatorio.');
      expect(response.text).toContain('value="Otra marca"');
      expect(update).not.toHaveBeenCalled();
    });

    test('POST válido actualiza y redirige', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce(sample);
      const update = jest.spyOn(productsService, 'update').mockResolvedValueOnce(sample);

      const response = await as('post', '/admin/products/7', manage)
        .type('form').send(validForm)
        .expect(302)
        .expect('Location', '/admin/products');
      expect(update).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Runner X', price: '1899.50' }));
      expect(response.headers['set-cookie'].join()).toContain('admin.products.updated');
    });

    test('POST a un producto inexistente responde 404', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce(null);
      const update = jest.spyOn(productsService, 'update');
      await as('post', '/admin/products/999', manage).type('form').send(validForm).expect(404);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('activar / desactivar', () => {
    test('desactiva un producto activo', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce({ ...sample, active: true });
      const update = jest.spyOn(productsService, 'update').mockResolvedValueOnce(sample);

      const response = await as('post', '/admin/products/7/active', manage)
        .expect(302)
        .expect('Location', '/admin/products');
      expect(update).toHaveBeenCalledWith(7, { active: false });
      expect(response.headers['set-cookie'].join()).toContain('admin.products.deactivated');
    });

    test('activa un producto inactivo', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce({ ...sample, active: false });
      const update = jest.spyOn(productsService, 'update').mockResolvedValueOnce(sample);

      const response = await as('post', '/admin/products/7/active', manage).expect(302);
      expect(update).toHaveBeenCalledWith(7, { active: true });
      expect(response.headers['set-cookie'].join()).toContain('admin.products.activated');
    });
  });

  describe('eliminar', () => {
    test('elimina un producto sin variantes y redirige', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce(sample);
      const remove = jest.spyOn(productsService, 'remove').mockResolvedValueOnce(sample);

      const response = await as('post', '/admin/products/7/delete', manage)
        .expect(302)
        .expect('Location', '/admin/products');
      expect(remove).toHaveBeenCalledWith(7);
      expect(response.headers['set-cookie'].join()).toContain('admin.products.deleted');
    });

    test('no elimina un producto con variantes y avisa con un mensaje de error', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce({ ...sample, variants: [{ id: 1 }] });
      const remove = jest.spyOn(productsService, 'remove');

      const response = await as('post', '/admin/products/7/delete', manage).expect(302);
      expect(remove).not.toHaveBeenCalled();
      expect(response.headers['set-cookie'].join()).toContain('admin.products.hasVariants');
    });

    test('responde 404 si el producto no existe', async () => {
      jest.spyOn(productsService, 'find').mockResolvedValueOnce(null);
      const remove = jest.spyOn(productsService, 'remove');
      await as('post', '/admin/products/999/delete', manage).expect(404);
      expect(remove).not.toHaveBeenCalled();
    });
  });
});
