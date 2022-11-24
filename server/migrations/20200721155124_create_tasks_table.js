// @ts-check

export const up = async (knex) => {
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('name');
    table.text('description');
    table.integer('status_id').references('task_statuses.id');
    table.integer('creator_id').references('users.id');
    table.integer('executor_id').references('users.id');
    table.timestamps(true, true);
  });
};

export const down = async (knex) => {
  await knex.schema.dropTable('tasks');
};
