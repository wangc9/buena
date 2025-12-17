import { type Kysely, sql } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("building")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("property_id", "uuid", (col) => col.references("property.id"))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("street", "text", (col) => col.notNull())
    .addColumn("house", "integer", (col) => col.notNull())
    .addColumn("other", "text")
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("building").execute();
}
