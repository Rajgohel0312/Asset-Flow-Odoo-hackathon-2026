import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Dashboard Analytics API Tests', () => {
  let adminToken = '';
  let employeeToken = '';

  beforeAll(async () => {
    const resAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@assetflow.com', password: 'Admin@123' });
    adminToken = resAdmin.body.data.token;

    const resEmp = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee@assetflow.com', password: 'Employee@123' });
    employeeToken = resEmp.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should fetch organization-wide dashboard data for Admin', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis).toBeDefined();
    expect(res.body.data.kpis.totalAssets).toBeDefined();
    expect(res.body.data.charts).toBeDefined();
    expect(res.body.data.charts.categoryDistribution).toBeDefined();
  });

  it('should fetch personalized dashboard metrics for standard Employee', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis).toBeDefined();
    expect(res.body.data.kpis.allocatedAssets).toBeDefined();
    expect(res.body.data.charts).toEqual({});
  });
});
