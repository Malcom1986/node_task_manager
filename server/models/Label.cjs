// @ts-check

const BaseModel = require('./BaseModel.cjs');

// const objectionUnique = require('objection-unique');

// const unique = objectionUnique({ fields: ['name'] });

// FIXME: при включении проверки на уникальность, перестаёт работать
// метод upserGraph для обновления тасков и связей.
// согласно доке unique нужно использовать $query
// но так не работает поскольку это противоречит доке objectionjs
// которая говорит что метод upsertGraph не должен использоваться
// с другими запросами.
// Сейчас создать неуникальную метку нельзя, но благодаря тому что возникает ошибка БД
// и выводится флеш, что создать метку не удалось.

// module.exports = class Label extends unique(BaseModel) {

module.exports = class Label extends BaseModel {
  static get tableName() {
    return 'labels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
      },
    };
  }

  static relationMappings = {
    tasks: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: 'Task.cjs',
      join: {
        from: 'labels.id',
        through: {
          from: 'tasks_labels.label_id',
          to: 'tasks_labels.task_id',
        },
        to: 'tasks.id',
      },
    },
  };
}
