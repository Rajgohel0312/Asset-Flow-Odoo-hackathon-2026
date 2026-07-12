import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Auditing API Tests', () => {
  let token = '';
  let categoryId = '';
  let assetId = '';
  let cycleId = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@assetflow.com', password: 'Admin@123' });
    token = res.body.data.token;

    const cat = await prisma.assetCategory.findFirst({
      where: { name: 'Electronics' },
    });
    categoryId = cat.id;

    const newAsset = await prisma.asset.create({
      data: {
        assetTag: `AF-AUDIT-${Date.now()}`,
        assetName: 'Audit Test Server',
        categoryId,
        purchaseCost: 5000,
        status: 'AVAILABLE',
      },
    });
    assetId = newAsset.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully open an audit cycle', async () => {
    const res = await request(app)
      .post('/api/v1/audits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Q3 Inventory Reconciliation',
        startDate: new Date(Date.now()).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('OPEN');
    cycleId = res.body.data.id;
  });

  it('should successfully submit audit item verification status as MISSING and update asset status to LOST', async () => {
    const res = await request(app)
      .post(`/api/v1/audits/${cycleId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetId,
        verificationStatus: 'MISSING',
        remarks: 'Not located in server rack B2',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationStatus).toBe('MISSING');

    const checkAsset = await prisma.asset.findUnique({ where: { id: assetId } });
    expect(checkAsset.status).toBe('LOST');
  });

  it('should successfully close the audit cycle', async () => {
    const res = await request(app)
      .patch(`/api/v1/audits/${cycleId}/close`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CLOSED');
  });
});
