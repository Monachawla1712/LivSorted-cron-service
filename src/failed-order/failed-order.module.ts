import { Module } from '@nestjs/common';
import { CommonService } from '../core/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FailedOrderService } from './failed-order.service';
import { FailedOrderEntity } from './failed-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FailedOrderEntity])],
  providers: [FailedOrderService, CommonService],
})
export class FailedOrderModule {}
