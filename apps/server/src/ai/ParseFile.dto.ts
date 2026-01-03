import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export class ParseFileDto extends createZodDto(
  z.object({ fileKey: z.string() }),
) {}
