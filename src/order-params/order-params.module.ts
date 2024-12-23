import { Module } from '@nestjs/common';
import { CommonService } from '../core/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderParamsService } from './order-params.service';
import { OrderParamsEntity } from './order-params.entity';
import { SuggestionEntity } from '../suggestions/suggestions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderParamsEntity, SuggestionEntity])],
  providers: [OrderParamsService, CommonService],
})
export class OrderParamsModule {}
