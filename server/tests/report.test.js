import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Operational Reports API Tests', () => {
  let token = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@assetflow.com', password: 'Admin@123' });
    token = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should retrieve asset report in JSON format', async () => {
    const res = await request(app)
      .get('/api/v1/reports/assets')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should retrieve asset report in CSV format', async () => {
    const res = await request(app)
      .get('/api/v1/reports/assets?format=csv')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});
