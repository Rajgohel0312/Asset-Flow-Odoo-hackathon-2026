import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Assets API Tests', () => {
  let token = '';
  let categoryId = '';
  let assetId = '';
  let uniqueTag = '';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@assetflow.com', password: 'Admin@123' });
    token = res.body.data.token;

    const cat = await prisma.assetCategory.findFirst({
      where: { name: 'Electronics', deletedAt: null },
    });
    categoryId = cat.id;
    uniqueTag = `AF-TAG-${Date.now()}`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully create a category', async () => {
    const res = await request(app)
      .post('/api/v1/assets/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Category ${Date.now()}`,
        description: 'Testing categories',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should successfully create an asset', async () => {
    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetTag: uniqueTag,
        assetName: 'Integration Test Laptop',
        categoryId,
        purchaseCost: 999.99,
        isBookable: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assetTag).toBe(uniqueTag);
    assetId = res.body.data.id;
  });

  it('should prevent creating duplicate asset tag', async () => {
    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetTag: uniqueTag,
        assetName: 'Another Test Laptop',
        categoryId,
        purchaseCost: 800,
      });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should list assets using query pagination and search parameters', async () => {
    const res = await request(app)
      .get(`/api/v1/assets?search=Integration&page=1&limit=5`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta.page).toBe(1);
  });
});
