import { Test, TestingModule } from '@nestjs/testing';
import { PropertyService } from './property.service';
import { DB_CONNECTION } from 'src/database/database.module';

const mockProperty = {
  id: 'prop-123',
  name: 'Sunshine Estate',
  type: 'WEG',
  manager: 'John Doe',
  accountant: 'Jane Smith',
  url: 'http://example.com/doc.pdf',
};

const createDbMock = () => ({
  selectFrom: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insertInto: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  executeTakeFirstOrThrow: jest.fn(),
});

describe('PropertyService', () => {
  let service: PropertyService;
  let dbMock: ReturnType<typeof createDbMock>;

  beforeEach(async () => {
    dbMock = createDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: DB_CONNECTION,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllProperty', () => {
    it('should return data and nextCursor when there are 10 items', async () => {
      const cursor = 0;
      const mockItems = Array(10).fill({ id: '1', name: 'Test' });
      dbMock.execute.mockResolvedValue(mockItems);

      const result = await service.getAllProperty(cursor);

      expect(dbMock.selectFrom).toHaveBeenCalledWith('property');
      expect(dbMock.offset).toHaveBeenCalledWith(cursor);
      expect(dbMock.limit).toHaveBeenCalledWith(10);

      expect(result.data).toEqual(mockItems);
      expect(result.nextCursor).toBe(10);
    });

    it('should return data without nextCursor when there are fewer than 10 items', async () => {
      const cursor = 20;
      const mockItems = Array(5).fill({ id: '1', name: 'Test' });
      dbMock.execute.mockResolvedValue(mockItems);

      const result = await service.getAllProperty(cursor);

      expect(result.data).toEqual(mockItems);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('getPropertyById', () => {
    it('should return the property object if found', async () => {
      dbMock.executeTakeFirstOrThrow.mockResolvedValue({ id: mockProperty.id });

      const result = await service.getPropertyById(mockProperty.id);

      expect(dbMock.selectFrom).toHaveBeenCalledWith('property');
      expect(dbMock.where).toHaveBeenCalledWith(
        'property.id',
        '=',
        mockProperty.id,
      );
      expect(result).toEqual({ id: mockProperty.id });
    });

    it('should return false if property is not found (db throws)', async () => {
      dbMock.executeTakeFirstOrThrow.mockRejectedValue(new Error('No result'));

      const result = await service.getPropertyById('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('createProperty', () => {
    const createDto = {
      type: 'WEG' as const,
      name: 'New Building',
      manager: 'Manager A',
      accountant: 'Accountant B',
      url: 'http://s3.url/file.pdf',
    };

    it('should insert property and return the result on success', async () => {
      const expectedResponse = { id: 'new-uuid', name: 'New Building' };
      dbMock.executeTakeFirstOrThrow.mockResolvedValue(expectedResponse);

      const result = await service.createProperty(createDto);

      expect(dbMock.insertInto).toHaveBeenCalledWith('property');
      expect(dbMock.values).toHaveBeenCalledWith(createDto);
      expect(dbMock.returning).toHaveBeenCalledWith([
        'property.id',
        'property.name',
      ]);
      expect(result).toEqual(expectedResponse);
    });

    it('should return false and log error on failure', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      dbMock.executeTakeFirstOrThrow.mockRejectedValue(
        new Error('DB Constraint Error'),
      );

      const result = await service.createProperty(createDto);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
