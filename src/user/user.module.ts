import { Module } from '@nestjs/common';
import { CommonService } from '../core/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserAudienceEntity } from './user-audience.entity';
import { AudienceEntity } from './audience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAudienceEntity, AudienceEntity])],
  providers: [UserService, CommonService],
})
export class UserModule {}
