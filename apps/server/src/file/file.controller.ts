import { Body, Controller, Post } from '@nestjs/common';
import { FileService } from './file.service';
import { PresignedUrlDto } from './PresignedUrl.dto';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  async getUploadUrl(@Body() presignedUrlDto: PresignedUrlDto) {
    return await this.fileService.getUploadUrl(presignedUrlDto.contentType);
  }
}
