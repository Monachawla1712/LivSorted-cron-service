import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { OrderParamsEntity } from './order-params.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class OrderParamsService {
  private readonly logger = new CustomLogger(OrderParamsService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(OrderParamsEntity)
    private readonly orderParamsRepository: Repository<OrderParamsEntity>,
  ) {}

  async getNumberParamValue(paramKey: string, defaultValue: number) {
    try {
      const param = await this.orderParamsRepository.findOne({
        where: { param_key: paramKey },
      });
      if (param == null) {
        return defaultValue;
      }
      return Number(param.param_value);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching paramKey :' + paramKey,
        e,
      );
      return defaultValue;
    }
  }

  async getStringParamValue(paramKey: string, defaultValue: string) {
    try {
      const param = await this.orderParamsRepository.findOne({
        where: { param_key: paramKey },
      });
      if (param == null) {
        return defaultValue;
      }
      return Number(param.param_value);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching paramKey :' + paramKey,
        e,
      );
      return defaultValue;
    }
  }
}
