/* eslint-disable @typescript-eslint/no-unused-vars */
import { type db } from '@cw/database';
import { UnitWithTempIdSchema } from '@cw/schema';
import { Injectable, Inject } from '@nestjs/common';
import { BuildingService } from 'src/building/building.service';
import { DB_CONNECTION } from 'src/database/database.module';
import z from 'zod';

@Injectable()
export class UnitService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: db,
    private readonly buildingService: BuildingService,
  ) {}

  async createUnits(values: z.infer<typeof UnitWithTempIdSchema>[]) {
    const buildingSet = new Set();
    const failedBuildingSet = new Set();
    const successUnits: { number: number }[] = [];
    const failedUnits: z.infer<typeof UnitWithTempIdSchema>[] = [];
    for (const unit of values) {
      const { ownershipShare, buildingId, buildingTempId, ...rest } = unit;
      if (!buildingSet.has(buildingId) && !failedBuildingSet.has(buildingId)) {
        const result = await this.buildingService.getBuildingById(buildingId);
        if (result === false) {
          failedBuildingSet.add(buildingId);
          failedUnits.push(unit);
          continue;
        } else {
          buildingSet.add(buildingId);
        }
      }

      try {
        const unitResult = await this.db
          .insertInto('unit')
          .values({
            ...rest,
            building_id: buildingId,
            ownership_share: ownershipShare,
          })
          .returning('unit.number')
          .executeTakeFirstOrThrow();
        successUnits.push(unitResult);
      } catch (error) {
        failedUnits.push(unit);
      }
    }
    return { successUnits, failedUnits };
  }
}
