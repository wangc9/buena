import { Body, Controller, Post } from '@nestjs/common';
import { UnitService } from './unit.service';
import { NewUnitsDto } from './NewUnits.dto';

@Controller('units')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  async createUnits(@Body() newUnitsDto: NewUnitsDto) {
    return await this.unitService.createUnits(newUnitsDto.units);
  }
}
