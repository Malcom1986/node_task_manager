// @ts-check

export const up = async (knex) => {
  await knex.schema.createTable('tasks_labels', (table) => {
    table.increments('id').primary();
    table.integer('task_id').references('tasks.id');
    table.integer('label_id').references('labels.id');
    table.timestamps(true, true);
  });
};

export const down = async (knex) => {
  await knex.schema.dropTable('tasks_labels');
};
