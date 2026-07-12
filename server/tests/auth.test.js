import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Authentication API Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully register a new user', async () => {
    const email = `test-${Date.now()}@assetflow.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email,
        password: 'Password@123',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
  });

  it('should reject register with duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@assetflow.com',
        password: 'Password@123',
      });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should successfully login and return a token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@assetflow.com',
        password: 'Admin@123',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@assetflow.com',
        password: 'WrongPassword',
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
