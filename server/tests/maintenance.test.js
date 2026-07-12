import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Maintenance Requests API Tests', () => {
  let token = '';
  let categoryId = '';
  let assetId = '';
  let requestId = '';

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
        assetTag: `AF-MAINT-${Date.now()}`,
        assetName: 'Maintenance Tablet',
        categoryId,
        purchaseCost: 400,
        status: 'AVAILABLE',
      },
    });
    assetId = newAsset.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully submit a maintenance request', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetId,
        priority: 'HIGH',
        issueDescription: 'Battery swelling and overheating',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    requestId = res.body.data.id;
  });

  it('should successfully approve a request and lock the asset to UNDER_MAINTENANCE', async () => {
    const res = await request(app)
      .patch(`/api/v1/maintenance/${requestId}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');

    const checkAsset = await prisma.asset.findUnique({ where: { id: assetId } });
    expect(checkAsset.status).toBe('UNDER_MAINTENANCE');
  });

  it('should successfully resolve request and release the asset to AVAILABLE', async () => {
    const res = await request(app)
      .patch(`/api/v1/maintenance/${requestId}/resolve`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RESOLVED');

    const checkAsset = await prisma.asset.findUnique({ where: { id: assetId } });
    expect(checkAsset.status).toBe('AVAILABLE');
  });
});
