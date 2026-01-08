import { Test, TestingModule } from '@nestjs/testing';
import { BuildingService } from './building.service';
import { PropertyService } from 'src/property/property.service';
import { DB_CONNECTION } from 'src/database/database.module';

const mockBuildingId = 'build-123';
const mockPropertyId = 'prop-456';
const mockTempId = 'temp-1';

const mockBuildingDto = {
  propertyId: mockPropertyId,
  tempId: mockTempId,
  name: 'Sunset Tower',
  street: 'Main St',
  house: 10,
  other: 'Corner lot',
};

const createMockQueryBuilder = () => {
  return {
    selectFrom: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
  };
};

describe('BuildingService', () => {
  let service: BuildingService;
  let dbMock: ReturnType<typeof createMockQueryBuilder>;
  let propertyServiceMock: Partial<PropertyService>;

  beforeEach(async () => {
    dbMock = createMockQueryBuilder();

    propertyServiceMock = {
      getPropertyById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildingService,
        {
          provide: DB_CONNECTION,
          useValue: dbMock,
        },
        {
          provide: PropertyService,
          useValue: propertyServiceMock,
        },
      ],
    }).compile();

    service = module.get<BuildingService>(BuildingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllBuildings', () => {
    it('should return all buildings', async () => {
      const mockResult = [{ id: '1', name: 'B1' }];
      dbMock.execute.mockResolvedValue(mockResult);

      const result = await service.getAllBuildings();

      expect(dbMock.selectFrom).toHaveBeenCalledWith('building');
      expect(dbMock.selectAll).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getBuildingById', () => {
    it('should return a building object if found', async () => {
      const mockResult = { id: mockBuildingId };
      dbMock.executeTakeFirstOrThrow.mockResolvedValue(mockResult);

      const result = await service.getBuildingById(mockBuildingId);

      expect(dbMock.selectFrom).toHaveBeenCalledWith('building');
      expect(dbMock.where).toHaveBeenCalledWith(
        'building.id',
        '=',
        mockBuildingId,
      );
      expect(result).toEqual(mockResult);
    });

    it('should return false if building is not found (db throws)', async () => {
      dbMock.executeTakeFirstOrThrow.mockRejectedValue(new Error('Not Found'));

      const result = await service.getBuildingById(mockBuildingId);

      expect(result).toBe(false);
    });
  });

  describe('createBuildings', () => {
    it('should successfully create buildings when property exists', async () => {
      (propertyServiceMock.getPropertyById as jest.Mock).mockResolvedValue({
        id: mockPropertyId,
      });

      const dbResponse = { id: 'new-id', name: 'Sunset Tower' };
      dbMock.executeTakeFirstOrThrow.mockResolvedValue(dbResponse);

      const input = [mockBuildingDto];
      const result = await service.createBuildings(input);

      expect(propertyServiceMock.getPropertyById).toHaveBeenCalledWith(
        mockPropertyId,
      );
      expect(dbMock.insertInto).toHaveBeenCalledWith('building');
      expect(result.successBuildings).toHaveLength(1);
      expect(result.successBuildings[0]).toEqual(dbResponse);
      expect(result.failedBuildings).toHaveLength(0);
    });

    it('should fail if property does not exist', async () => {
      (propertyServiceMock.getPropertyById as jest.Mock).mockResolvedValue(
        false,
      );

      const input = [mockBuildingDto];
      const result = await service.createBuildings(input);

      expect(propertyServiceMock.getPropertyById).toHaveBeenCalledWith(
        mockPropertyId,
      );
      expect(dbMock.insertInto).not.toHaveBeenCalled();

      expect(result.successBuildings).toHaveLength(0);
      expect(result.failedBuildings).toHaveLength(1);
      expect(result.failedBuildings[0]).toEqual(mockBuildingDto);
    });

    it('should fail if DB insert throws an error', async () => {
      (propertyServiceMock.getPropertyById as jest.Mock).mockResolvedValue(
        true,
      );

      dbMock.executeTakeFirstOrThrow.mockRejectedValue(new Error('DB Error'));

      const input = [mockBuildingDto];
      const result = await service.createBuildings(input);

      expect(dbMock.insertInto).toHaveBeenCalled();
      expect(result.successBuildings).toHaveLength(0);
      expect(result.failedBuildings).toHaveLength(1);
    });

    it('should only check property existence once per propertyId (Caching logic)', async () => {
      (propertyServiceMock.getPropertyById as jest.Mock).mockResolvedValue(
        true,
      );
      dbMock.executeTakeFirstOrThrow.mockResolvedValue({ id: '1', name: 'B' });

      const input = [mockBuildingDto, { ...mockBuildingDto, name: 'Tower 2' }];

      await service.createBuildings(input);

      expect(propertyServiceMock.getPropertyById).toHaveBeenCalledTimes(1);
      expect(dbMock.insertInto).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed results (some succeed, some fail)', async () => {
      const validPropId = 'valid-prop';
      const invalidPropId = 'invalid-prop';

      (propertyServiceMock.getPropertyById as jest.Mock).mockImplementation(
        (id) => {
          return Promise.resolve(id === validPropId ? true : false);
        },
      );

      dbMock.executeTakeFirstOrThrow.mockResolvedValue({ id: '1', name: 'OK' });

      const input = [
        { ...mockBuildingDto, propertyId: validPropId },
        { ...mockBuildingDto, propertyId: invalidPropId },
      ];

      const result = await service.createBuildings(input);

      expect(result.successBuildings).toHaveLength(1);
      expect(result.failedBuildings).toHaveLength(1);
      expect(result.failedBuildings[0].propertyId).toBe(invalidPropId);
    });
  });
});
