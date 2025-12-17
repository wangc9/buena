import { PropertySchema } from '@cw/schema';
import { createZodDto } from 'nestjs-zod';

export class NewPropertyDto extends createZodDto(PropertySchema) {}
