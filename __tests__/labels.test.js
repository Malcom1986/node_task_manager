// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let cookie;
  let models;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: true } });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;

    await knex.migrate.latest();
    await prepareData(app);
    cookie = await signIn(app, app.reverse('session'), testData.users.existing);
  });

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.labels.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      cookies: cookie,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const label = await models.label.query().findOne(params);
    expect(label).toMatchObject(params);
  });

  it('edit', async () => {
    const currentLabel = await models.label.query()
      .findOne({ name: testData.labels.existing.name });
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: currentLabel.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const currentLabel = await models.label.query()
      .findOne({ name: testData.labels.existing.name });
    const params = testData.labels.updated;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('label', { id: currentLabel.id }),
      cookies: cookie,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const label = await models.label.query().findById(currentLabel.id);
    expect(label).toMatchObject(params);
  });

  it('delete', async () => {
    const currentLabel = await models.label.query()
      .findOne({ name: testData.labels.deleted.name });
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('label', { id: currentLabel.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const label = await models.label.query().findById(currentLabel.id);
    expect(label).toBeUndefined();
  });

  afterAll(() => {
    app.close();
  });
});
