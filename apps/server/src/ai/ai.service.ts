/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  private readonly lambdaClient: LambdaClient;
  private readonly lambdaName: string;

  constructor(private readonly configService: ConfigService) {
    this.lambdaClient = new LambdaClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.lambdaName =
      this.configService.get<string>('PARSER_LAMBDA_NAME') || '';
  }

  async parsePdf(fileKey: string) {
    const command = new InvokeCommand({
      FunctionName: this.lambdaName,
      Payload: JSON.stringify({ fileKey }),
    });

    const response = await this.lambdaClient.send(command);

    const responsePayload = JSON.parse(
      new TextDecoder().decode(response.Payload),
    );

    if (responsePayload.statusCode !== 200) {
      throw new Error(`Lambda Error: ${responsePayload.error}`);
    }

    return responsePayload.body;
  }
}
