// @ts-check

export const up = async (knex) => {
  await knex.schema.createTable('task_statuses', (table) => {
    table.increments('id').primary();
    table.string('name').unique();
    table.timestamps(true, true);
  });
};

export const down = async (knex) => {
  await knex.schema.dropTable('task_statuses');
};
