import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Asset Allocations API Tests', () => {
  let token = '';
  let categoryId = '';
  let employeeId = '';
  let assetId = '';
  let allocationId = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@assetflow.com', password: 'Admin@123' });
    token = res.body.data.token;

    const emp = await prisma.user.findFirst({
      where: { email: 'employee@assetflow.com' },
    });
    employeeId = emp.id;

    const cat = await prisma.assetCategory.findFirst({
      where: { name: 'Electronics' },
    });
    categoryId = cat.id;

    const newAsset = await prisma.asset.create({
      data: {
        assetTag: `AF-ALLOC-${Date.now()}`,
        assetName: 'Allocation Laptop',
        categoryId,
        purchaseCost: 1000,
        status: 'AVAILABLE',
      },
    });
    assetId = newAsset.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully allocate an available asset to an employee', async () => {
    const res = await request(app)
      .post('/api/v1/allocations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetId,
        employeeId,
        expectedReturnDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    allocationId = res.body.data.id;

    const checkAsset = await prisma.asset.findUnique({ where: { id: assetId } });
    expect(checkAsset.status).toBe('ALLOCATED');
  });

  it('should fail to allocate an asset that is already allocated', async () => {
    const res = await request(app)
      .post('/api/v1/allocations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetId,
        employeeId,
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not available');
  });

  it('should successfully process returning the asset', async () => {
    const res = await request(app)
      .patch(`/api/v1/allocations/${allocationId}/return`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        returnNotes: 'Returned in perfect condition',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RETURNED');

    const checkAsset = await prisma.asset.findUnique({ where: { id: assetId } });
    expect(checkAsset.status).toBe('AVAILABLE');
  });
});
