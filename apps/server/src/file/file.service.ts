import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
  private readonly region: string | undefined;
  private readonly s3Client: S3Client;
  private readonly bucketName: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION');
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.bucketName = this.configService.get<string>('UPLOAD_BUCKET_NAME');
  }

  async getUploadUrl(contentType: string) {
    console.log(contentType);
    const key = crypto.randomBytes(16).toString('hex');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ChecksumAlgorithm: undefined,
    });

    if (!this.bucketName) {
      throw new Error('UPLOAD_BUCKET_NAME is not set');
    }

    try {
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 300,
        signableHeaders: new Set(['content-type']),
      });
      return { url, key };
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
