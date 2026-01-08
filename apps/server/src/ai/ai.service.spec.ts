/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';
import { LambdaClient } from '@aws-sdk/client-lambda';

const mockLambdaSend = jest.fn();
const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-lambda', () => {
  return {
    LambdaClient: jest.fn().mockImplementation(() => ({
      send: mockLambdaSend,
    })),
    InvokeCommand: jest.fn().mockImplementation((args) => args),
    InvocationType: { Event: 'Event' },
  };
});

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockS3Send,
    })),
    GetObjectCommand: jest.fn().mockImplementation((args) => args),
  };
});

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

describe('AIService', () => {
  let service: AIService;
  let configService: ConfigService;

  const mockConfig = {
    AWS_REGION: 'eu-north-1',
    AWS_ACCESS_KEY_ID: 'test-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret',
    PARSER_LAMBDA_NAME: 'test-lambda-func',
    UPLOAD_BUCKET_NAME: 'test-bucket',
  };

  beforeEach(async () => {
    mockLambdaSend.mockReset();
    mockS3Send.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (key: string) => mockConfig[key as keyof typeof mockConfig],
            ),
          },
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(LambdaClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'eu-north-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      }),
    );
  });

  describe('startPdfParse', () => {
    it('should invoke lambda asynchronously and return job info', async () => {
      const fileKey = 'uploads/doc.pdf';

      mockLambdaSend.mockResolvedValue({});

      const result = await service.startPdfParse(fileKey);

      expect(result).toEqual({
        jobId: 'test-uuid-1234',
        status: 'pending',
      });

      expect(mockLambdaSend).toHaveBeenCalledTimes(1);

      const commandArgs = mockLambdaSend.mock.calls[0][0];

      expect(commandArgs).toEqual(
        expect.objectContaining({
          FunctionName: 'test-lambda-func',
          InvocationType: 'Event',
        }),
      );

      const payload = JSON.parse(commandArgs.Payload);
      expect(payload).toEqual({
        fileKey: 'uploads/doc.pdf',
        jobId: 'test-uuid-1234',
      });
    });

    it('should throw if lambda client fails', async () => {
      mockLambdaSend.mockRejectedValue(new Error('AWS Error'));
      await expect(service.startPdfParse('file.pdf')).rejects.toThrow(
        'AWS Error',
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return parsed JSON if S3 file exists', async () => {
      const jobId = 'job-123';
      const mockResultData = { status: 'completed', data: { foo: 'bar' } };

      mockS3Send.mockResolvedValue({
        Body: {
          transformToString: jest
            .fn()
            .mockResolvedValue(JSON.stringify(mockResultData)),
        },
      });

      const result = await service.getJobStatus(jobId);

      expect(result).toEqual(mockResultData);

      const commandArgs = mockS3Send.mock.calls[0][0];
      expect(commandArgs).toEqual({
        Bucket: 'test-bucket',
        Key: `results/${jobId}.json`,
      });
    });

    it('should return status: pending if S3 throws NoSuchKey', async () => {
      const jobId = 'job-pending';

      const noKeyError: any = new Error('Not Found');
      noKeyError.name = 'NoSuchKey';
      mockS3Send.mockRejectedValue(noKeyError);

      const result = await service.getJobStatus(jobId);

      expect(result).toEqual({ status: 'pending' });
    });

    it('should return status: pending if S3 response body is empty', async () => {
      const jobId = 'job-empty';

      mockS3Send.mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(undefined),
        },
      });

      const result = await service.getJobStatus(jobId);

      expect(result).toEqual({ status: 'pending' });
    });

    it('should re-throw unexpected S3 errors', async () => {
      const jobId = 'job-error';
      const accessError: any = new Error('Access Denied');
      accessError.name = 'AccessDeniedException';

      mockS3Send.mockRejectedValue(accessError);

      await expect(service.getJobStatus(jobId)).rejects.toThrow(
        'Access Denied',
      );
    });
  });
});
