# @cw/database

A shared internal package that provides a type-safe Kysely client and manages database migrations.

## Usage

```typescript
import { db } from "@cw/database";

await db.selectFrom("property").selectAll().execute();
```

## Migrations

This package uses `kysely-ctl` to manage schema changes.

```Bash
# Run pending migrations (Locally)
yarn run migrate:up

# Create a new migration file
yarn run migrate:make add_users_table
```

## Type Generation

After creating a migration, you must regenerate the TypeScript types so the rest of the monorepo knows about the changes.

```Bash
# Introspects the DB and updates src/db.ts
yarn run codegen
```

_Note: You must have a Postgres instance running and configured in .env (DATABASE_URL) for codegen to work._
