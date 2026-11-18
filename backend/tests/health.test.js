import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const env = {
  NODE_ENV: 'test',
  API_PREFIX: '/api',
  CLIENT_URL: 'http://localhost:5173',
  ADMIN_CLIENT_URL: 'http://localhost:5174',
  DEFAULT_CURRENCY: 'INR',
  HOTEL_TIMEZONE: 'Asia/Kolkata',
  JWT_SECRET: 'test-secret-with-more-than-thirty-two-characters',
};

test('health endpoint reports database outage without exposing configuration', async () => {
  const response = await request(createApp(env)).get('/api/health');
  assert.equal(response.status, 503);
  assert.equal(response.body.data.status, 'unhealthy');
  assert.equal(response.body.data.database, 'disconnected');
  assert.equal(JSON.stringify(response.body).includes(env.JWT_SECRET), false);
});

test('unknown routes return the standard error response', async () => {
  const response = await request(createApp(env)).get('/api/not-a-route');
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(Array.isArray(response.body.errors), true);
});

test('protected booking routes reject requests without an access token', async () => {
  const response = await request(createApp(env)).get('/api/bookings/my');
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('protected booking routes reject malformed bearer tokens', async () => {
  const response = await request(createApp(env)).get('/api/bookings/my').set('Authorization', 'Bearer invalid-token');
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('public registration rejects attempts to assign a privileged role', async () => {
  const response = await request(createApp(env)).post('/api/auth/register').send({
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'long-enough-password',
    role: 'super_admin',
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('CORS rejects origins outside the configured allowlist', async () => {
  const response = await request(createApp(env)).get('/api/health').set('Origin', 'https://untrusted.example');
  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('CORS permits the separate administration frontend origin', async () => {
  const response = await request(createApp(env)).get('/api/health').set('Origin', env.ADMIN_CLIENT_URL);
  assert.equal(response.headers['access-control-allow-origin'], env.ADMIN_CLIENT_URL);
});

test('administrator API resources require authentication', async () => {
  for (const path of ['/api/admin/dashboard', '/api/admin/staff', '/api/admin/services', '/api/admin/settings']) {
    const response = await request(createApp(env)).get(path);
    assert.equal(response.status, 401, `${path} should require authentication`);
    assert.equal(response.body.success, false);
  }
});

test('room list query rejects unrecognized or malformed filters', async () => {
  const response = await request(createApp(env)).get('/api/rooms?sortBy=%24where');
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('availability rejects impossible stay dates before querying MongoDB', async () => {
  const response = await request(createApp(env)).get('/api/rooms/availability?checkIn=2026-02-30&checkOut=2026-03-02');
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});
