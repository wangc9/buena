import { Test, TestingModule } from '@nestjs/testing';
import { UnitService } from './unit.service';
import { BuildingService } from 'src/building/building.service';
import { DB_CONNECTION } from 'src/database/database.module';

const mockBuildingId = 'build-123';
const mockUnitInput = {
  buildingId: mockBuildingId,
  buildingTempId: 'temp-1',
  type: 'Apartment' as const,
  number: 101,
  floor: 1,
  entrance: 'A',
  size: 50,
  ownershipShare: '10/1000',
  year: 2023,
  rooms: 2,
};

const createDbMock = () => ({
  insertInto: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  executeTakeFirstOrThrow: jest.fn(),
});

describe('UnitService', () => {
  let service: UnitService;
  let dbMock: ReturnType<typeof createDbMock>;
  let buildingServiceMock: Partial<BuildingService>;

  beforeEach(async () => {
    dbMock = createDbMock();

    buildingServiceMock = {
      getBuildingById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitService,
        {
          provide: DB_CONNECTION,
          useValue: dbMock,
        },
        {
          provide: BuildingService,
          useValue: buildingServiceMock,
        },
      ],
    }).compile();

    service = module.get<UnitService>(UnitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUnits', () => {
    it('should successfully create a unit when building exists', async () => {
      (buildingServiceMock.getBuildingById as jest.Mock).mockResolvedValue({
        id: mockBuildingId,
      });

      const expectedDbResult = { number: 101 };
      dbMock.executeTakeFirstOrThrow.mockResolvedValue(expectedDbResult);

      const result = await service.createUnits([mockUnitInput]);

      expect(buildingServiceMock.getBuildingById).toHaveBeenCalledWith(
        mockBuildingId,
      );

      expect(dbMock.insertInto).toHaveBeenCalledWith('unit');
      expect(dbMock.values).toHaveBeenCalledWith({
        type: 'Apartment',
        number: 101,
        floor: 1,
        entrance: 'A',
        size: 50,
        year: 2023,
        rooms: 2,
        building_id: mockBuildingId,
        ownership_share: '10/1000',
      });

      expect(result.successUnits).toHaveLength(1);
      expect(result.successUnits[0]).toEqual(expectedDbResult);
      expect(result.failedUnits).toHaveLength(0);
    });

    it('should fail to create unit if building does not exist', async () => {
      (buildingServiceMock.getBuildingById as jest.Mock).mockResolvedValue(
        false,
      );

      const result = await service.createUnits([mockUnitInput]);

      expect(buildingServiceMock.getBuildingById).toHaveBeenCalledWith(
        mockBuildingId,
      );

      expect(dbMock.insertInto).not.toHaveBeenCalled();

      expect(result.successUnits).toHaveLength(0);
      expect(result.failedUnits).toHaveLength(1);
      expect(result.failedUnits[0]).toEqual(mockUnitInput);
    });

    it('should handle database insertion errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      (buildingServiceMock.getBuildingById as jest.Mock).mockResolvedValue(
        true,
      );

      dbMock.executeTakeFirstOrThrow.mockRejectedValue(new Error('DB Error'));

      const result = await service.createUnits([mockUnitInput]);

      expect(dbMock.insertInto).toHaveBeenCalled();

      expect(result.successUnits).toHaveLength(0);
      expect(result.failedUnits).toHaveLength(1);
      expect(result.failedUnits[0]).toEqual(mockUnitInput);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should optimize building checks (check unique buildingIds only once)', async () => {
      (buildingServiceMock.getBuildingById as jest.Mock).mockResolvedValue(
        true,
      );
      dbMock.executeTakeFirstOrThrow.mockResolvedValue({ number: 1 });

      const inputs = [mockUnitInput, { ...mockUnitInput, number: 102 }];

      await service.createUnits(inputs);

      expect(buildingServiceMock.getBuildingById).toHaveBeenCalledTimes(1);

      expect(dbMock.insertInto).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed results (some success, some fail)', async () => {
      const validBuildingId = 'valid-b';
      const invalidBuildingId = 'invalid-b';

      (buildingServiceMock.getBuildingById as jest.Mock).mockImplementation(
        (id) => {
          return Promise.resolve(id === validBuildingId ? true : false);
        },
      );

      dbMock.executeTakeFirstOrThrow.mockResolvedValue({ number: 1 });

      const inputs = [
        { ...mockUnitInput, buildingId: validBuildingId },
        { ...mockUnitInput, buildingId: invalidBuildingId },
      ];

      const result = await service.createUnits(inputs);

      expect(result.successUnits).toHaveLength(1);
      expect(result.failedUnits).toHaveLength(1);
      expect(result.failedUnits[0].buildingId).toBe(invalidBuildingId);
    });
  });
});
