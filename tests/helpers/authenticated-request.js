async function loginAndGetToken(app, email, password) {
  const response = await require('supertest')(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (response.status !== 200 || !response.body.data || !response.body.data.token) {
    throw new Error(`Login failed with status ${response.status}`);
  }

  return response.body.data.token;
}

function withToken(requestBuilder, token) {
  return requestBuilder.set('Authorization', `Bearer ${token}`);
}

module.exports = { loginAndGetToken, withToken };