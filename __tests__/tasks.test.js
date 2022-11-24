// @ts-check

import fastify from 'fastify';

import _ from 'lodash';
import init from '../server/plugin.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test tasks CRUD', () => {
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
      url: app.reverse('tasks'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.tasks.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      cookies: cookie,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const expectedTask = _.omit(params, 'labels');
    const task = await models.task.query().findOne(expectedTask);
    expect(task).toMatchObject(expectedTask);
    const taskLabels = await task.$relatedQuery('labels');
    const expectedLabels = await models.label.query().findByIds(params.labels);
    expect(taskLabels).toMatchObject(expectedLabels);
  });

  it('show', async () => {
    const currentTask = await models.task.query()
      .findOne({ name: testData.tasks.existing.name });
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('task', { id: currentTask.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('edit', async () => {
    const currentTask = await models.task.query()
      .findOne({ name: testData.tasks.existing.name });
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editTask', { id: currentTask.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const currentTask = await models.task.query()
      .findOne({ name: testData.tasks.existing.name });
    const params = testData.tasks.updated;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('task', { id: currentTask.id }),
      cookies: cookie,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const expectedTask = _.omit(params, 'labels');
    const task = await models.task.query().findById(currentTask.id);
    expect(task).toMatchObject(expectedTask);
    const taskLabels = await task.$relatedQuery('labels');
    const expectedLabels = await models.label.query().findByIds(params.labels);
    expect(taskLabels).toMatchObject(expectedLabels);
  });

  it('delete', async () => {
    const currentTask = await models.task.query()
      .findOne({ name: testData.tasks.deleted.name });
    const labels = await currentTask.$relatedQuery('labels');
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('task', { id: currentTask.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const task = await models.task.query().findById(currentTask.id);
    expect(task).toBeUndefined();
    // eslint-disable-next-line
    for (const label of labels) {
      // eslint-disable-next-line
      const relatedTasks = await label.$relatedQuery('tasks');
      const tasksIds = _.map(relatedTasks, 'id');
      expect(tasksIds).not.toContain(currentTask.id);
    }
  });

  afterAll(() => {
    app.close();
  });
});
