import { PresignedUrlSchema } from '@cw/schema';
import { createZodDto } from 'nestjs-zod';

export class PresignedUrlDto extends createZodDto(PresignedUrlSchema) {}
