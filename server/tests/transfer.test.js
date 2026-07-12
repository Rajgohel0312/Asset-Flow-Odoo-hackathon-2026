import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Asset Transfers API Tests', () => {
  let token = '';
  let categoryId = '';
  let employee1Id = '';
  let employee2Id = '';
  let assetId = '';
  let transferId = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@assetflow.com', password: 'Admin@123' });
    token = res.body.data.token;

    const emp1 = await prisma.user.findFirst({
      where: { email: 'employee@assetflow.com' },
    });
    employee1Id = emp1.id;

    const emp2 = await prisma.user.findFirst({
      where: { email: 'manager@assetflow.com' },
    });
    employee2Id = emp2.id;

    const cat = await prisma.assetCategory.findFirst({
      where: { name: 'Electronics' },
    });
    categoryId = cat.id;

    const newAsset = await prisma.asset.create({
      data: {
        assetTag: `AF-XFER-${Date.now()}`,
        assetName: 'Transfer Laptop',
        categoryId,
        purchaseCost: 1200,
        status: 'AVAILABLE',
      },
    });
    assetId = newAsset.id;

    await prisma.assetAllocation.create({
      data: {
        assetId,
        employeeId: employee1Id,
        allocatedBy: employee2Id,
        status: 'ACTIVE',
      },
    });
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'ALLOCATED' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully request an asset transfer', async () => {
    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetId,
        toEmployeeId: employee2Id,
        reason: 'Change in team assignment',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    transferId = res.body.data.id;
  });

  it('should successfully approve a transfer request and re-allocate the asset', async () => {
    const res = await request(app)
      .patch(`/api/v1/transfers/${transferId}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');

    const oldAlloc = await prisma.assetAllocation.findFirst({
      where: { assetId, employeeId: employee1Id, status: 'RETURNED' },
    });
    expect(oldAlloc).not.toBeNull();

    const newAlloc = await prisma.assetAllocation.findFirst({
      where: { assetId, employeeId: employee2Id, status: 'ACTIVE' },
    });
    expect(newAlloc).not.toBeNull();
  });
});
