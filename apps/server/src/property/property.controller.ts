import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PropertyService } from './property.service';
import { NewPropertyDto } from './NewProperty.dto';

@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  async getAllProperty(@Query('cursor') cursor: number) {
    return await this.propertyService.getAllProperty(cursor);
  }

  @Post()
  async createProperty(@Body() newPropertyDto: NewPropertyDto) {
    return await this.propertyService.createProperty(newPropertyDto);
  }
}
