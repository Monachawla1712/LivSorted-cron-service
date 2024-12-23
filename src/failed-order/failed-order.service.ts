import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { FailedOrderEntity } from './failed-order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class FailedOrderService {
  private readonly logger = new CustomLogger(FailedOrderService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(FailedOrderEntity)
    private readonly failedOrderRepository: Repository<FailedOrderEntity>,
  ) {}

  async createUserStoreMapping(user_id: string, store_id: string) {
    return true;
  }

  async saveFailedOrder(failedOrderBean) {
    await this.failedOrderRepository.save(failedOrderBean);
  }
}
