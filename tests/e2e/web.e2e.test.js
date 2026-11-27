const request = require('supertest');
const { getBaseUrl } = require('./helpers');

describe('E2E Web session', () => {
  const baseUrl = getBaseUrl();

  test('login -> authenticated request -> logout -> rejected', async () => {
    const agent = request.agent(baseUrl);

    const login = await agent
      .post('/login')
      .type('form')
      .send({
        email: process.env.E2E_USER_EMAIL,
        password: process.env.E2E_USER_PASSWORD
      });
    expect(login.status).toBe(302);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);

    const logout = await agent.post('/logout');
    expect(logout.status).toBe(302);

    const after = await agent.get('/api/auth/me');
    expect(after.status).toBe(401);
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
