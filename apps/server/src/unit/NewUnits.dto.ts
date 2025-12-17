import { UnitArraySchema } from '@cw/schema';
import { createZodDto } from 'nestjs-zod';

export class NewUnitsDto extends createZodDto(UnitArraySchema) {}
