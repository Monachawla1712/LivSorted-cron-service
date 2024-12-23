import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../core/http-exception.filter';
import { EventsService } from './events.service';
import { SplEventDto } from './dto/spl-event.dto';
import { WinnerEntity } from './winner.entity';
import { FindOptionsWhere } from 'typeorm';
import { SelectionType } from './classes/selection-type.enum';
import { EventEntity } from './event.entity';
import { UserService } from '../user/user.service';
import { StoreService } from '../store/store.service';
import { StoreEntity } from '../store/store.entity';
import {
  LeaderboardResponse,
  StoreLeaderboardDetails,
} from './classes/leaderboardResponse';
import { SplAggregate } from './classes/spl-aggregate';
import { EventParamsService } from './event-params.service';
import { LeaderboardParams } from './classes/leaderboardParams';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller()
@UseFilters(HttpExceptionFilter)
export class EventsController {
  private readonly logger = new CustomLogger(EventsController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private eventsService: EventsService,
    private userService: UserService,
    private storeService: StoreService,
    private eventParamsService: EventParamsService,
  ) {}

  @Post('event/spl')
  async runSPLCron(@Headers('userId') userId, @Body() eventDto: SplEventDto) {
    const events = await this.eventsService.getActiveSplEventsFromIds(
      eventDto.eventIds,
    );

    for (const event of events) {
      try {
        if (
          (await this.eventsService.isEventDone(event)) ||
          !(await this.eventsService.matchEventFrequency(event))
        ) {
          continue;
        }
        const eventSelectionType = this.getEventSelectionType(event, 'RANDOM');
        if (eventSelectionType == SelectionType.RANDOM) {
          await this.eventsService.randomWinnersSplEvent(
            event,
            'STORE',
            userId,
          );
        } else if (eventSelectionType == SelectionType.CONDITIONAL) {
          await this.eventsService.conditionalWinnersSplEvent(
            event,
            'STORE',
            userId,
          );
        } else if (eventSelectionType == SelectionType.MERIT) {
          await this.eventsService.meritWinnersSplEvent(event, 'STORE', userId);
        } else {
          this.logger.log(
            this.asyncContext.get('traceId'),
            'Event winner selection type not found',
          );
        }
      } catch (e) {
        this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong while SPL cron',
          e,
        );
      }
    }
    return true;
  }

  private getEventSelectionType(event: EventEntity, defaultType: string) {
    if (
      event == null ||
      event.rules == null ||
      event.rules.winner == null ||
      event.rules.winner.selectionType == null
    ) {
      return defaultType;
    }
    return event.rules.winner.selectionType;
  }

  @Get('event/spl/winners')
  async getWinners(
    @Headers('userId') userId,
    @Query('date') date: string,
    @Query('entityId') entityId: string,
    @Query('entityType') entityType: string,
  ) {
    const filtersMap: FindOptionsWhere<WinnerEntity> =
      this.buildWinnersFilterMap(date, entityId, entityType);
    return await this.eventsService.getWinners(filtersMap);
  }

  private buildWinnersFilterMap(
    date: string,
    entityId: string,
    entityType: string,
  ) {
    const filters: FindOptionsWhere<WinnerEntity> = {};
    if (date != null) {
      filters.date = new Date(date);
    }
    if (entityId != null) {
      filters.entityId = entityId;
    }
    if (entityType != null) {
      filters.entityType = entityType;
    }
    return filters;
  }

  @Get('event/order-leaders')
  async orderLeaderboard(
    @Headers('userId') userId,
    @Headers('storeId') storeId,
  ) {
    const leaderboardParams = (await this.eventParamsService.getJsonParamValue(
      'LEADERBOARD_EVENTS_AUDIENCES',
      {},
    )) as LeaderboardParams;
    const audience = await this.userService.getMappedUserAudience(
      storeId,
      'STORE',
      leaderboardParams.audienceIds,
    );
    if (audience == null) {
      throw new HttpException(
        { message: 'Audience not Found. Store is not part of any Event.' },
        404,
      );
    }
    const event = await this.eventsService.getLeaderboardEventFromAudienceId(
      leaderboardParams.eventIds,
      audience.id,
    );
    const leaderboard = await this.eventsService.meritWinnersLeaderboardEvent(
      event,
    );
    const storesMap = this.storeService.getStoresMap(
      await this.storeService.getStoresFromStoreIds(
        leaderboard.map((aggregate) => aggregate.storeId),
      ),
    );
    return this.prepareLeaderboardResponse(
      leaderboard,
      storesMap,
      event,
      storeId,
    );
  }

  private prepareLeaderboardResponse(
    leaderboard: SplAggregate[],
    storesMap: Map<string, StoreEntity>,
    event: EventEntity,
    entityId: string,
  ) {
    const response = new LeaderboardResponse();
    let index = 0;
    for (const aggregateObject of leaderboard) {
      const storeLeaderboardDetails = new StoreLeaderboardDetails(
        storesMap.get(aggregateObject.storeId),
        index < event.rules.reward.merit.length
          ? event.rules.reward.merit.at(index)
          : null,
        aggregateObject.finalBillAmount,
      );
      response.leaderboard.push(storeLeaderboardDetails);
      if (aggregateObject.storeId === entityId) {
        response.myRank = index + 1;
        if (storeLeaderboardDetails.prize != null) {
          response.eventStatusMessage =
            event.rules.eventDetails.eventSuccessTrigger.message;
          response.eventStatusIconImageUrl =
            event.rules.eventDetails.eventSuccessTrigger.icon;
        } else {
          response.eventStatusMessage =
            event.rules.eventDetails.eventFailureTrigger.message;
          response.eventStatusIconImageUrl =
            event.rules.eventDetails.eventFailureTrigger.icon;
        }
      }
      index += 1;
    }
    response.bannerLink = event.rules.eventDetails.bannerLink;
    response.bannerImageUrl = event.rules.eventDetails.bannerImageUrl;
    return response;
  }
}
