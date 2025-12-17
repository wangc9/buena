import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { DB } from "./db";

export const createDialect = (connectionString?: string) =>
  new PostgresDialect({
    pool: new Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  });

export type db = Kysely<DB>;

export const createKysely = (connectionString: string): db => {
  return new Kysely({
    dialect: createDialect(connectionString),
  });
};
