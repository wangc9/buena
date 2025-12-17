import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { BuildingController } from './building.controller';
import { BuildingService } from './building.service';
import { PropertyModule } from 'src/property/property.module';
import { PropertyService } from 'src/property/property.service';

@Module({
  imports: [DatabaseModule, PropertyModule],
  controllers: [BuildingController],
  providers: [BuildingService, PropertyService],
})
export class BuildingModule {}
