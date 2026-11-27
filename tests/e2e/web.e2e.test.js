const request = require('supertest');
const { getBaseUrl } = require('./helpers');

describe('E2E Web session', () => {
  const baseUrl = getBaseUrl();

  test('login -> protected SSR page -> logout -> protected page redirects to login', async () => {
    const agent = request.agent(baseUrl);

    const login = await agent
      .post('/login')
      .type('form')
      .send({
        email: process.env.E2E_USER_EMAIL,
        password: process.env.E2E_USER_PASSWORD
      });
    expect(login.status).toBe(302);

    const orders = await agent.get('/my/orders');
    expect(orders.status).toBe(200);
    expect(orders.headers['content-type']).toMatch(/text\/html/);

    const logout = await agent.post('/logout');
    expect(logout.status).toBe(302);

    await agent.get('/my/orders')
      .expect(302)
      .expect('Location', '/login?returnTo=%2Fmy%2Forders');
  });

  test('wrong password re-renders the form with 401', async () => {
    const res = await request(baseUrl)
      .post('/login')
      .type('form')
      .set('Accept-Language', 'en')
      .send({ email: process.env.E2E_USER_EMAIL, password: 'definitely-wrong' });

    expect(res.status).toBe(401);
    expect(res.text).toContain('Invalid Credentials');
  });
});
