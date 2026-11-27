const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const { User } = require('../models/sql');
const { verifyPassword } = require('../utils/password');
const jwtConfig = require('../config/jwt');

function cookieFor(userId) {
  const token = jwt.sign({ sub: String(userId) }, jwtConfig.secret, {
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
  return `access_token=${token}`;
}

const activeUser = { id: 7, first_name: 'Ana', active: true, role: { permissions: [] } };

beforeEach(() => {
  jest.clearAllMocks();
  User.findOne.mockResolvedValue(null);
  User.findByPk.mockResolvedValue(null);
  verifyPassword.mockResolvedValue(true);
});

describe('GET /login', () => {
  test('200 HTML with title, meta description, form and html lang (en)', async () => {
    const res = await request(app).get('/login?lang=en');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('action="/login"');
    expect(res.text).toMatch(/<title>[^<]*Sign in[^<]*<\/title>/);
    expect(res.text).toContain('<meta name="description"');
    expect(res.text).toContain('<html lang="en">');
  });

  test('same page in Spanish', async () => {
    const res = await request(app).get('/login?lang=es');

    expect(res.text).toContain('Iniciar sesión');
    expect(res.text).toContain('<html lang="es">');
  });

  test('redirects to / when there is already a session', async () => {
    User.findByPk.mockResolvedValue(activeUser);

    const res = await request(app).get('/login').set('Cookie', cookieFor(7));

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});

describe('POST /login', () => {
  test('400 with field errors, keeps the email', async () => {
    const res = await request(app)
      .post('/login?lang=en')
      .type('form')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('value="not-an-email"');
    expect(res.text).toContain('Enter a valid email address');
    expect(res.text).toContain('Enter your password');
  });

  test('401 for unknown user, no cookie set', async () => {
    const res = await request(app)
      .post('/login?lang=en')
      .type('form')
      .send({ email: 'nobody@test.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.text).toContain('Invalid Credentials');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  test('401 for inactive user', async () => {
    User.findOne.mockResolvedValue({ id: 5, active: false, password_hash: 'h' });

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'off@test.com', password: 'Password123!' });

    expect(res.status).toBe(401);
  });

  test('401 for a wrong password', async () => {
    User.findOne.mockResolvedValue({ id: 5, active: true, password_hash: 'h' });
    verifyPassword.mockResolvedValue(false);

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'a@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  test('302 to / with an HttpOnly SameSite cookie on success (PRG)', async () => {
    User.findOne.mockResolvedValue({ id: 101, active: true, password_hash: 'h' });

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'a@test.com', password: 'Password123!' });

    const cookies = res.headers['set-cookie'].join(';');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
    expect(cookies).toContain('access_token=');
    expect(cookies).toContain('HttpOnly');
    expect(cookies).toContain('SameSite=Lax');
  });

  test.each([
    ['/products', '/products'],
    ['https://evil.com', '/'],
    ['//evil.com', '/']
  ])('returnTo %s redirects to %s', async (returnTo, expected) => {
    User.findOne.mockResolvedValue({ id: 101, active: true, password_hash: 'h' });

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'a@test.com', password: 'Password123!', returnTo });

    expect(res.headers.location).toBe(expected);
  });
});

describe('Session in the header', () => {
  test('without a session shows the login link', async () => {
    const res = await request(app).get('/?lang=en');

    expect(res.text).toContain('href="/login"');
    expect(res.text).not.toContain('action="/logout"');
  });

  test('with a valid cookie shows logout and never leaks hashes', async () => {
    User.findByPk.mockResolvedValue({
      ...activeUser,
      password_hash: 'SECRET-HASH',
      salt_key: 'SECRET-SALT'
    });

    const res = await request(app).get('/?lang=en').set('Cookie', cookieFor(7));

    expect(res.text).toContain('action="/logout"');
    expect(res.text).not.toContain('SECRET-HASH');
    expect(res.text).not.toContain('SECRET-SALT');
  });

  test('an invalid cookie is cleared and the page still renders', async () => {
    const res = await request(app).get('/').set('Cookie', 'access_token=garbage');

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join(';')).toContain('access_token=;');
  });
});

describe('POST /logout', () => {
  test('clears the cookie and redirects to /', async () => {
    const res = await request(app).post('/logout').set('Cookie', cookieFor(7));

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
    expect(res.headers['set-cookie'].join(';')).toContain('access_token=;');
  });
});

describe('Flash message', () => {
  test('is shown once after login', async () => {
    User.findOne.mockResolvedValue({ id: 101, active: true, password_hash: 'h' });
    User.findByPk.mockResolvedValue(activeUser);

    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ email: 'a@test.com', password: 'x' });

    const first = await agent.get('/?lang=en');
    const second = await agent.get('/?lang=en');

    expect(first.text).toContain('Login successful');
    expect(second.text).not.toContain('Login successful');
  });
});
