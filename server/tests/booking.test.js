import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Resource Bookings API Tests', () => {
  let token = '';
  let categoryId = '';
  let assetId = '';
  let bookingId = '';

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
        assetTag: `AF-BOOK-${Date.now()}`,
        assetName: 'Bookable Projector',
        categoryId,
        purchaseCost: 500,
        status: 'AVAILABLE',
        isBookable: true,
      },
    });
    assetId = newAsset.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully book a bookable resource', async () => {
    const startTime = new Date(Date.now() + 3600000 * 24).toISOString();
    const endTime = new Date(Date.now() + 3600000 * 26).toISOString();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetId,
        startTime,
        endTime,
        purpose: 'Sprint Retrospective',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UPCOMING');
    bookingId = res.body.data.id;
  });

  it('should fail to book the resource during overlapping times', async () => {
    const startTime = new Date(Date.now() + 3600000 * 24.5).toISOString();
    const endTime = new Date(Date.now() + 3600000 * 25.5).toISOString();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assetId,
        startTime,
        endTime,
        purpose: 'Overlapping reservation',
      });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should successfully cancel a booking', async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');
  });
});
