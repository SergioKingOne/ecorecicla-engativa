const request = require('supertest');
const app = require('../src/app');

const DEMO_PASSWORD = 'Demo1234!';

async function login(email, password = DEMO_PASSWORD) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  if (response.status !== 200) {
    throw new Error(`Login failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.token;
}

module.exports = { app, request, login, DEMO_PASSWORD };
