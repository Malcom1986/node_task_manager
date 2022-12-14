// @ts-check

import i18next from 'i18next';
import _ from 'lodash';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .post('/users', async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);

      try {
        const validUser = app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(validUser);
        req.flash('info', i18next.t('flash.user.create.success'));
        reply.redirect(app.reverse('root'));
      } catch (e) {
        req.log.info(e);
        req.flash('error', i18next.t('flash.user.create.error'));
        reply.render('users/new', { user, errors: e.data });
      }

      return reply;
    })
    .get('/users/:id/edit', { name: 'editUser', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;

      if (Number(id) !== req.user.id) {
        req.flash('error', i18next.t('flash.user.accessError'));
        reply.redirect(app.reverse('users'));
        return reply;
      }

      const user = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { user });
      return reply;
    })
    .patch('/users/:id', { name: 'user', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;

      if (Number(id) !== req.user.id) {
        req.flash('error', i18next.t('flash.user.accessError'));
        reply.redirect(app.reverse('users'));
        return reply;
      }

      const user = await app.objection.models.user.query().findById(id);

      try {
        await user.$query().patch(req.body.data);
        req.flash('info', i18next.t('flash.user.edit.success'));
        reply.redirect(app.reverse('users'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.user.edit.error'));
        reply.code(422);
        user.$set(req.body.user);
        reply.render('users/edit', { user, errors: data });
      }

      return reply;
    })
    .delete('/users/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;

      if (Number(id) !== req.user.id) {
        req.flash('error', i18next.t('flash.user.accessError'));
        reply.redirect(app.reverse('users'));
        return reply;
      }

      const user = await app.objection.models.user.query().findById(id);
      const creatorTasks = await user.$relatedQuery('creatorTasks');
      const executorTasks = await user.$relatedQuery('executorTasks');

      if (_.isEmpty(creatorTasks) && _.isEmpty(executorTasks)) {
        await app.objection.models.user.query().deleteById(id);
        req.logOut();
        req.flash('info', i18next.t('flash.user.delete.success'));
      } else {
        req.flash('error', i18next.t('flash.user.delete.error'));
      }

      reply.redirect(app.reverse('users'));
      return reply;
    });
};
