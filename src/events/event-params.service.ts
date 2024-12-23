import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventParamsEntity } from './event-params.entity';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class EventParamsService {
  private readonly logger = new CustomLogger(EventParamsService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(EventParamsEntity)
    private readonly eventParamsRepository: Repository<EventParamsEntity>,
  ) {}

  async getNumberParamValue(paramKey: string, defaultValue: number) {
    try {
      const param = await this.eventParamsRepository.findOne({
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
      const param = await this.eventParamsRepository.findOne({
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

  async getJsonParamValue(
    paramKey: string,
    defaultValue: object,
  ): Promise<object> {
    try {
      const param = await this.eventParamsRepository.findOne({
        where: { param_key: paramKey },
      });
      if (param == null) {
        return defaultValue;
      }
      return JSON.parse(param.param_value);
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
