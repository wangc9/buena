import { defineConfig } from "kysely-ctl";
import { createDialect } from "../src/kysely";

export default defineConfig({
  dialect: createDialect(),
});
