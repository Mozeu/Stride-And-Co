const request = require('supertest');
const app = require('../app');
 
describe('API /api/products', () => {
 
  // create
  test('POST /api/products crea un producto y responde 201', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Zapatos Stride', price: 599 });
 
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Product Created',
      data: expect.any(Object)
    });
  });
 
  // read
  test('GET /api/products responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/products');
 
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
 
  // read by id
  test('GET /api/products/:id responde 200 y usa el parámetro recibido', async () => {
    const res = await request(app).get('/api/products/1');
 
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Product by ID');
  });
 
  // -update
  test('PUT /api/products/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .send({ name: 'Zapatos Stride v2' });
 
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Product Updated');
  });
