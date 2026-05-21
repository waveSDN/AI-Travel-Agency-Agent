const request = require('supertest');

// Mock all external dependencies before requiring the app
jest.mock('../src/database/customerRepository', () => ({
  findOrCreateByPhone: jest.fn().mockResolvedValue({ id: 'cust-1', phone: '+966500000000' }),
}));

jest.mock('../src/database/followUpRepository', () => ({
  cancelFollowUpsForCustomer: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/agents/travelAgent', () => ({
  process: jest.fn().mockResolvedValue({
    reply: 'Hello! How can I help you?',
    entities: {},
    leadScore: 0,
    leadClass: 'cold',
    escalated: false,
  }),
}));

jest.mock('../src/services/whatsappService', () => ({
  sendMessage: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../src/services/schedulerService', () => ({
  startScheduler: jest.fn(),
}));

jest.mock('../src/config/env', () => ({
  validateEnv: jest.fn(),
  server: { port: 3001, env: 'test' },
  supabase: { url: 'http://mock', serviceKey: 'mock' },
  claude: { apiKey: 'mock', model: 'claude-test', maxTokens: 100 },
  whatsapp: { verifyToken: 'test-token', accessToken: null, phoneNumberId: null },
  staff: { phone: null },
  rateLimit: { windowMs: 900000, max: 100 },
  leadScore: { vipThreshold: 80, escalateThreshold: 30 },
  followUp: { day1: 1, day2: 3, day3: 7 },
}));

const app = require('../src/index');

describe('POST /webhook', () => {
  test('returns 200 for valid payload', async () => {
    const res = await request(app)
      .post('/webhook')
      .send({ user: '+966500000000', message: 'I want a ticket to Jeddah' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 400 when user is missing', async () => {
    const res = await request(app)
      .post('/webhook')
      .send({ message: 'Hello' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when message is missing', async () => {
    const res = await request(app)
      .post('/webhook')
      .send({ user: '+966500000000' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid phone number', async () => {
    const res = await request(app)
      .post('/webhook')
      .send({ user: 'notaphone', message: 'Hello' });
    expect(res.status).toBe(400);
  });
});

describe('GET /health', () => {
  test('responds with health status', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });
});

describe('GET /webhook (verification)', () => {
  test('verifies webhook with correct token', async () => {
    const res = await request(app)
      .get('/webhook')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'test-token', 'hub.challenge': 'abc123' });
    expect(res.status).toBe(200);
    expect(res.text).toBe('abc123');
  });

  test('rejects incorrect token', async () => {
    const res = await request(app)
      .get('/webhook')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': 'abc' });
    expect(res.status).toBe(403);
  });
});
