/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: () => 'mocked-hex-key',
  }),
}));

describe('FileService', () => {
  let service: FileService;
  let configService: ConfigService;

  const mockConfig = {
    AWS_REGION: 'eu-north-1',
    AWS_ACCESS_KEY_ID: 'test-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret',
    UPLOAD_BUCKET_NAME: 'test-bucket',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
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

    service = module.get<FileService>(FileService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(S3Client).toHaveBeenCalledWith({
      region: 'eu-north-1',
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      },
    });
  });

  describe('getUploadUrl', () => {
    it('should generate a signed url and return key/url pair', async () => {
      const contentType = 'image/png';
      const mockSignedUrl = 'https://s3.aws.com/signed-url';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      const result = await service.getUploadUrl(contentType);

      expect(crypto.randomBytes).toHaveBeenCalledWith(16);

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'mocked-hex-key',
        ContentType: contentType,
        ChecksumAlgorithm: undefined,
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          expiresIn: 300,
          signableHeaders: new Set(['content-type']),
        }),
      );

      expect(result).toEqual({
        url: mockSignedUrl,
        key: 'mocked-hex-key',
      });
    });

    it('should throw error if UPLOAD_BUCKET_NAME is not set', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FileService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key) => {
                if (key === 'UPLOAD_BUCKET_NAME') return undefined;
                return 'val';
              }),
            },
          },
        ],
      }).compile();
      const serviceNoBucket = module.get<FileService>(FileService);

      await expect(serviceNoBucket.getUploadUrl('image/png')).rejects.toThrow(
        'UPLOAD_BUCKET_NAME is not set',
      );
    });

    it('should return null and log error if getSignedUrl fails', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('AWS Error'));

      const result = await service.getUploadUrl('application/pdf');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
