import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UnitController } from './unit.controller';
import { UnitService } from './unit.service';
import { BuildingModule } from 'src/building/building.module';
import { BuildingService } from 'src/building/building.service';
import { PropertyModule } from 'src/property/property.module';
import { PropertyService } from 'src/property/property.service';

@Module({
  imports: [DatabaseModule, BuildingModule, PropertyModule],
  controllers: [UnitController],
  providers: [UnitService, BuildingService, PropertyService],
})
export class UnitModule {}
