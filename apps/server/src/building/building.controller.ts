import { Body, Controller, Post } from '@nestjs/common';
import { BuildingService } from './building.service';
import { NewBuildingDto } from './NewBuilding.dto';

@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Post()
  async createBuildings(@Body() newBuildingDto: NewBuildingDto) {
    return await this.buildingService.createBuildings(newBuildingDto.buildings);
  }
}
