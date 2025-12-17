import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}
