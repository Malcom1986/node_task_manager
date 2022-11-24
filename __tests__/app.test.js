// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';

describe('requests', () => {
  let app;

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: true } });
    await init(app);
  });

  it('GET 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('root'),
    });
    expect(response.statusCode).toBe(200);
  });

  it('GET 404', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/wrong-path',
    });
    expect(response.statusCode).toBe(404);
  });

  afterAll(() => {
    app.close();
  });
});
