/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Post } from '@nestjs/common';
import { AIService } from './ai.service';
import { ParseFileDto } from './ParseFile.dto';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('parse')
  async parse(@Body() body: ParseFileDto) {
    return this.aiService.parsePdf(body.fileKey);
  }
}
