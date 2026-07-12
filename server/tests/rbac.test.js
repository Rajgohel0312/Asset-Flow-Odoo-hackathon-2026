import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('RBAC Authorization Rules API Tests', () => {
  let adminToken = '';
  let employeeToken = '';
  let categoryId = '';

  beforeAll(async () => {
    const resAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@assetflow.com', password: 'Admin@123' });
    adminToken = resAdmin.body.data.token;

    const resEmp = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee@assetflow.com', password: 'Employee@123' });
    employeeToken = resEmp.body.data.token;

    const cat = await prisma.assetCategory.findFirst({
      where: { name: 'Electronics' },
    });
    categoryId = cat.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should block standard Employee from registering a new asset (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        assetTag: `AF-RBAC-${Date.now()}`,
        assetName: 'RBAC Laptop Block',
        categoryId,
        purchaseCost: 1000,
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow Admin to successfully register a new asset (201 Created)', async () => {
    const tag = `AF-RBAC-${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetTag: tag,
        assetName: 'RBAC Laptop Allowed',
        categoryId,
        purchaseCost: 1200,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assetTag).toBe(tag);
  });
});
