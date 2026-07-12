import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

describe('Notifications API Tests', () => {
  let token = '';
  let employeeId = '';
  let notifId = '';

  beforeAll(async () => {
    const email = `notif-user-${Date.now()}@assetflow.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Notif',
        lastName: 'User',
        email,
        password: 'Password@123',
      });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Password@123' });
    token = res.body.data.token;
    employeeId = res.body.data.user.id;

    const newNotif = await prisma.notification.create({
      data: {
        userId: employeeId,
        title: 'Mock Test Notification',
        message: 'Notification body test',
        type: 'SYSTEM',
        isRead: false,
      },
    });
    notifId = newNotif.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should list notifications and return unreadCount in meta metadata', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.unreadCount).toBeGreaterThan(0);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should mark a notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(checkRes.body.meta.unreadCount).toBe(0);
  });
});
