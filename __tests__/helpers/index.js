// @ts-check

import { URL } from 'url';
import fs from 'fs';
import path from 'path';

const getFixturePath = (filename) => path.join('..', '..', '__fixtures__', filename);
const readFixture = (filename) => fs.readFileSync(new URL(getFixturePath(filename), import.meta.url), 'utf-8').trim();
const getFixtureData = (filename) => JSON.parse(readFixture(filename));

export const getTestData = () => getFixtureData('testData.json');

export const prepareData = async (app) => {
  const { knex } = app.objection;

  await knex('users').insert(getFixtureData('users.json'));
  await knex('task_statuses').insert(getFixtureData('taskStatuses.json'));
  await knex('labels').insert(getFixtureData('labels.json'));
  await knex('tasks').insert(getFixtureData('tasks.json'));
  await knex('tasks_labels').insert(getFixtureData('tasksLabels.json'));
};

export const signIn = async (app, url, params) => {
  const response = await app.inject({
    method: 'POST',
    url,
    payload: {
      data: params,
    },
  });

  const [sessionCookie] = response.cookies;
  const { name, value } = sessionCookie;
  return { [name]: value };
};
