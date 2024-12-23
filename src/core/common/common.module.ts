import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuggestionEntity } from '../../suggestions/suggestions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SuggestionEntity])],
  providers: [CommonService],
})
export class CommonModule {}
