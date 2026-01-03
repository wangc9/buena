/* eslint-disable @typescript-eslint/no-unused-vars */
import { type db } from '@cw/database';
import { BuildingWithTempIdSchema } from '@cw/schema';
import { Injectable, Inject } from '@nestjs/common';
import { DB_CONNECTION } from 'src/database/database.module';
import { PropertyService } from 'src/property/property.service';
import z from 'zod';

@Injectable()
export class BuildingService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: db,
    private readonly propertyService: PropertyService,
  ) {}
  async getAllBuildings() {
    return await this.db.selectFrom('building').selectAll().execute();
  }

  async getBuildingById(id: string) {
    try {
      return await this.db
        .selectFrom('building')
        .select('building.id')
        .where('building.id', '=', id)
        .executeTakeFirstOrThrow();
    } catch (error) {
      return false;
    }
  }

  async createBuildings(values: z.infer<typeof BuildingWithTempIdSchema>[]) {
    const propertySet = new Set();
    const failedPropertySet = new Set();
    const successBuildings: { id: string; name: string }[] = [];
    const failedBuildings: z.infer<typeof BuildingWithTempIdSchema>[] = [];
    for (const building of values) {
      const { propertyId, tempId, ...rest } = building;
      if (!propertySet.has(propertyId) && !failedPropertySet.has(propertyId)) {
        const result = await this.propertyService.getPropertyById(propertyId);
        if (result === false) {
          failedPropertySet.add(propertyId);
          failedBuildings.push(building);
          continue;
        } else {
          propertySet.add(propertyId);
        }
      }

      try {
        const buildingResult = await this.db
          .insertInto('building')
          .values({ ...rest, property_id: propertyId })
          .returning(['building.id', 'building.name'])
          .executeTakeFirstOrThrow();
        successBuildings.push(buildingResult);
      } catch (error) {
        failedBuildings.push(building);
      }
    }
    return { successBuildings, failedBuildings };
  }
}
