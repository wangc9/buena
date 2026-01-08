# @cw/schema

Shared Zod schemas and TypeScript types. This ensures the Frontend forms and Backend DTOs are always in sync.

## Usage

```typescript
import { PropertySchema } from "@cw/schema";

// Use in Frontend Form
const form = useForm({ resolver: zodResolver(PropertySchema) });

// Use in Backend DTO
export class CreatePropertyDto extends createZodDto(PropertySchema) {}
```

## Workflow

1. Modify a schema in src/index.ts.
2. Run `yarn build`.
3. Both Frontend and Backend immediately receive the updated types.
