import { DataSource, In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAudienceEntity } from './user-audience.entity';
import { AudienceEntity } from './audience.entity';
import { OrderService } from '../order/order.service';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class UserService {
  private readonly logger = new CustomLogger(UserService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(UserAudienceEntity)
    private readonly userAudienceEntityRepository: Repository<UserAudienceEntity>,
    @InjectRepository(AudienceEntity)
    private readonly audienceRepository: Repository<AudienceEntity>,
    private dataSource: DataSource,
    private orderService: OrderService,
  ) {}

  async getAudienceList(
    audienceId: number,
    entityType: string,
  ): Promise<string[]> {
    const audience = await this.audienceRepository.findOne({
      where: { id: audienceId, active: 1 },
    });
    let audienceList: string[] = [];
    if (audience.isMapped == 1) {
      audienceList = (
        await this.userAudienceEntityRepository.find({
          where: { audienceId: audienceId, entityType: entityType, active: 1 },
          select: ['entityId'],
        })
      ).map((audience) => {
        return audience.entityId;
      });
    } else if (audience.rules.queryType == 'RAW' && entityType == 'STORE') {
      const params = [];
      const aa = await this.dataSource.query(audience.rules.query, params);
      audienceList = (
        (await this.dataSource.query(audience.rules.query)) as {
          store_id: string;
        }[]
      ).map((audience) => {
        return audience.store_id;
      });
    }

    return audienceList;
  }

  async getUserDynamicAudience(
    entityId,
    entityType: string,
    audienceIds: number[],
  ): Promise<AudienceEntity> {
    const audiences = await this.audienceRepository.find({
      where: { id: In(audienceIds), active: 1, isMapped: 0 },
    });
    for (const audience of audiences) {
      if (entityType == 'STORE') {
        if (await this.isLeaderboardAudience(audience, entityId)) {
          return audience;
        }
      }
    }
    return null;
  }

  async getMappedUserAudience(
    entityId,
    entityType: string,
    audienceIds: number[],
  ): Promise<AudienceEntity> {
    const userAudienceMapping = await this.userAudienceEntityRepository.findOne(
      {
        where: {
          entityType: entityType,
          entityId: entityId,
          audienceId: In(audienceIds),
        },
      },
    );
    if (userAudienceMapping == null) {
      return null;
    }
    return await this.audienceRepository.findOne({
      where: { id: userAudienceMapping.audienceId, active: 1, isMapped: 1 },
    });
  }

  private async isLeaderboardAudience(audience: AudienceEntity, entityId) {
    if (
      audience.rules.audienceTag == 'FRANCHISEORDERLEADERBOARD' &&
      entityId != null
    ) {
      const orderAggregateObject =
        await this.orderService.getOrderAggregateObject(
          entityId,
          new Date().toISOString().slice(0, 10),
        );
      if (
        orderAggregateObject.finalBillAmount >=
          audience.rules.params.orderLowerLimit &&
        orderAggregateObject.finalBillAmount <
          audience.rules.params.orderUpperLimit
      ) {
        return true;
      }
    }
    return false;
  }
}
