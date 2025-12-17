import { BuildingArraySchema } from '@cw/schema';
import { createZodDto } from 'nestjs-zod';

export class NewBuildingDto extends createZodDto(BuildingArraySchema) {}
