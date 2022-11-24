// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test task statuses CRUD', () => {
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
      url: app.reverse('statuses'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.taskStatuses.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      cookies: cookie,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const taskStatus = await models.taskStatus.query().findOne(params);
    expect(taskStatus).toMatchObject(params);
  });

  it('edit', async () => {
    const currentTaskStatus = await models.taskStatus.query()
      .findOne({ name: testData.taskStatuses.existing.name });
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id: currentTaskStatus.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const currentTaskStatus = await models.taskStatus.query()
      .findOne({ name: testData.taskStatuses.existing.name });
    const params = testData.taskStatuses.updated;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('status', { id: currentTaskStatus.id }),
      cookies: cookie,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const taskStatus = await models.taskStatus.query().findById(currentTaskStatus.id);
    expect(taskStatus).toMatchObject(params);
  });

  it('delete', async () => {
    const currentTaskStatus = await models.taskStatus.query()
      .findOne({ name: testData.taskStatuses.deleted.name });
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('status', { id: currentTaskStatus.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const taskStatus = await models.taskStatus.query().findById(currentTaskStatus.id);
    expect(taskStatus).toBeUndefined();
  });

  afterAll(() => {
    app.close();
  });
});
