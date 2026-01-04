/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AIService } from './ai.service';
import { ParseFileDto } from './ParseFile.dto';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('parse')
  async startParse(@Body() body: ParseFileDto) {
    return this.aiService.startPdfParse(body.fileKey);
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    return this.aiService.getJobStatus(jobId);
  }
}
