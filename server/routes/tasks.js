// @ts-check

import i18next from 'i18next';
import _ from 'lodash';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const filterOptions = req.query;
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();

      const query = app.objection.models.task.query()
        .withGraphJoined('[status, creator, executor, labels]')
        .modify('sortByLatestCreatedDate');

      const {
        status, executor, label, isCreatorUser,
      } = filterOptions;
      if (status) {
        query.modify('findByStatus', status);
      }
      if (executor) {
        query.modify('findByExecutor', executor);
      }
      if (isCreatorUser) {
        query.modify('findByCreator', req.user.id);
      }
      if (label) {
        query.modify('findByLabel', label);
      }

      const tasks = await query;

      reply.render('tasks/index', {
        tasks, statuses, users, labels, filterOptions,
      });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();

      reply.render('tasks/new', {
        task, statuses, users, labels,
      });
      return reply;
    })
    .post('/tasks', { preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      const { data: formData } = req.body;
      const labelsIds = [_.get(formData, 'labels', [])].flat();
      const existingLabels = await app.objection.models.label.query().findByIds(labelsIds);
      const taskData = {
        ...formData,
        statusId: Number(formData.statusId),
        creatorId: req.user.id,
        executorId: !formData.executorId ? null : Number(formData.executorId),
        labels: existingLabels,
      };

      try {
        await app.objection.models.task.transaction(async (trx) => {
          const insertedTask = await app.objection.models.task.query(trx)
            .insertGraph(taskData, { relate: ['labels'] });
          return insertedTask;
        });

        req.flash('info', i18next.t('flash.task.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        const statuses = await app.objection.models.taskStatus.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();

        req.flash('error', i18next.t('flash.task.create.error'));
        reply.code(422);
        task.$set(formData);
        reply.render('tasks/new', {
          task, errors: data, statuses, users, labels,
        });
      }

      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id).withGraphJoined('labels');
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      task.$set({ ...task, labels: _.map(task.labels, 'id') });

      reply.render('tasks/edit', {
        task, statuses, users, labels,
      });
      return reply;
    })
    .get('/tasks/:id', { name: 'task', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query()
        .findById(id).withGraphJoined('[status, creator, executor, labels]');

      reply.render('tasks/show', { task });
      return reply;
    })
    .patch('/tasks/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { data: formData } = req.body;
      const labelsIds = [_.get(formData, 'labels', [])].flat();
      const existingLabels = await app.objection.models.label.query().findByIds(labelsIds);
      const task = await app.objection.models.task.query().findById(id);
      const taskData = {
        ...task,
        ...formData,
        statusId: Number(formData.statusId),
        executorId: !formData.executorId ? null : Number(formData.executorId),
        labels: existingLabels,
      };

      try {
        await app.objection.models.task.transaction(async (trx) => {
          const updatedTask = await app.objection.models.task.query(trx)
            .allowGraph('labels')
            .upsertGraph(taskData, {
              relate: true, unrelate: true, noDelete: true,
            });
          return updatedTask;
        });

        req.flash('info', i18next.t('flash.task.edit.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        const statuses = await app.objection.models.taskStatus.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();
        task.$set({ ...formData, id });

        req.flash('error', i18next.t('flash.task.edit.error'));
        reply.code(422);
        reply.render('tasks/edit', {
          task, errors: data, statuses, users, labels,
        });
      }

      return reply;
    })
    .delete('/tasks/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;

      const task = await app.objection.models.task.query().findById(id);

      if (task.creatorId !== req.user.id) {
        req.flash('error', i18next.t('flash.task.delete.error'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }

      await task.$relatedQuery('labels').unrelate();
      await task.$query().delete();
      req.flash('info', i18next.t('flash.task.delete.success'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};
