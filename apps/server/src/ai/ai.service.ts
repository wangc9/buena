/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  InvocationType,
  InvokeCommand,
  LambdaClient,
  LambdaClientConfig,
} from '@aws-sdk/client-lambda';
import { GetObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AIService {
  private readonly lambdaClient: LambdaClient;
  private readonly lambdaName: string;
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    const lambdaClientConfig: LambdaClientConfig = { region };

    if (accessKeyId && secretAccessKey) {
      lambdaClientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    const s3ClientConfig: S3ClientConfig = { region };

    if (accessKeyId && secretAccessKey) {
      s3ClientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    this.lambdaClient = new LambdaClient(lambdaClientConfig);
    this.lambdaName =
      this.configService.get<string>('PARSER_LAMBDA_NAME') || '';

    this.s3Client = new S3Client(s3ClientConfig);
    this.bucketName =
      this.configService.get<string>('UPLOAD_BUCKET_NAME') || '';
  }

  async startPdfParse(fileKey: string) {
    const jobId = uuidv4();
    const command = new InvokeCommand({
      FunctionName: this.lambdaName,
      InvocationType: InvocationType.Event,
      Payload: JSON.stringify({ fileKey, jobId }),
    });

    await this.lambdaClient.send(command);

    return { jobId, status: 'pending' };

    // try {
    //   const response = await this.lambdaClient.send(command);

    //   if (response.FunctionError) {
    //     const rawError = new TextDecoder().decode(response.Payload);
    //     console.error(
    //       `Lambda Function Crash: ${response.FunctionError}`,
    //       rawError,
    //     );
    //     throw new Error(`Lambda crashed: ${response.FunctionError}`);
    //   }
    //   const responsePayload = JSON.parse(
    //     new TextDecoder().decode(response.Payload),
    //   );

    //   if (responsePayload.statusCode !== 200) {
    //     const errorMessage = responsePayload.error || 'Unknown Lambda Error';

    //     console.error(
    //       `Lambda Execution Failed: ${JSON.stringify(errorMessage)}`,
    //     );

    //     throw new Error(`Lambda Error: ${errorMessage}`);
    //   }
    //   return responsePayload.body;
    // } catch (error) {
    //   console.error('AI Service Error:', error);
    //   throw error;
    // }
  }

  async getJobStatus(jobId: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `results/${jobId}.json`,
      });

      const response = await this.s3Client.send(command);
      const str = await response.Body?.transformToString();

      if (!str) {
        return { status: 'pending' };
      }

      return JSON.parse(str);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return { status: 'pending' };
      }
      throw error;
    }
  }
}
