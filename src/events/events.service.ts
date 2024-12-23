import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EventEntity } from './event.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { WinnerEntity } from './winner.entity';
import { Engine, RuleProperties } from 'json-rules-engine';
import * as moment from 'moment';
import { UserService } from '../user/user.service';
import { OrderService } from '../order/order.service';
import { SplAggregate } from './classes/spl-aggregate';
import { FranchiseOrderEntity } from '../order/franchise-order.entity';
import { Prize } from './classes/event-conditions';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class EventsService {
  private readonly logger = new CustomLogger(EventsService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(WinnerEntity)
    private readonly winnerRepository: Repository<WinnerEntity>,
    private rulesEngine: Engine,
    private userService: UserService,
    private orderService: OrderService,
  ) {}

  getActiveSplEventsFromIds(eventIds: number[]) {
    return this.eventRepository.find({
      where: { id: In(eventIds), active: 1 },
    });
  }

  getLeaderboardEventFromAudienceId(eventIds: number[], audienceId: number) {
    return this.eventRepository.findOne({
      where: { id: In(eventIds), active: 1, audienceId: audienceId },
    });
  }

  async segregateConditionalWinners(
    rules: RuleProperties,
    entityIdConditionalMap: Map<string, any>,
  ) {
    const winnerList: string[] = [];
    this.rulesEngine.addRule(rules);
    for (const [entityId, splAggregate] of entityIdConditionalMap.entries()) {
      if (!(await this.checkWinner(splAggregate))) {
        entityIdConditionalMap.delete(entityId);
      } else {
        winnerList.push(entityId);
      }
    }
    this.rulesEngine.removeRule('EngineRule');
    return winnerList;
  }

  async checkWinner(conditions): Promise<boolean> {
    const event = await this.rulesEngine.run(conditions);
    if (event.events.length) {
      this.rulesEngine.removeRule('EngineRule');
      return true;
    }
    return false;
  }

  getRandomWinners(audienceList: string[], selectionNumber: number): string[] {
    const winnerIndices = this.generateRandomNumbersInRange(
      Math.min(audienceList.length, selectionNumber),
      audienceList.length,
    );
    const winnerArray: string[] = [];
    winnerIndices.forEach((index) => {
      winnerArray.push(audienceList.at(index));
    });
    return winnerArray;
  }

  generateRandomNumbersInRange(n, max) {
    const randomNumbers = new Set<number>();
    while (randomNumbers.size < n) {
      const randomNumber = Math.floor(Math.random() * max);
      if (!randomNumbers.has(randomNumber)) {
        randomNumbers.add(randomNumber);
      }
    }
    return randomNumbers;
  }

  async saveWinners(winnerList: WinnerEntity[]) {
    await this.winnerRepository.save(winnerList);
  }

  getRandomRewards(prizeList: Prize[], length: number) {
    const winnerPrizeList: Prize[] = [];
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * prizeList.length);
      winnerPrizeList.push(prizeList.at(idx));
    }
    return winnerPrizeList;
  }

  async getWinners(filtersMap: FindOptionsWhere<WinnerEntity>) {
    return this.winnerRepository.find({ where: filtersMap });
  }

  async isEventDone(event: EventEntity) {
    const winnerList = await this.winnerRepository.find({
      where: { date: new Date(), eventId: event.id },
    });
    return winnerList.length != 0;
  }

  async matchEventFrequency(event: EventEntity) {
    const currDate = new Date();
    if (event.startDate > currDate || event.endDate < currDate) {
      return false;
    }
    const startDaysDiff = this.getDaysBetween(currDate, event.startDate);
    return startDaysDiff % event.frequency === 0;
  }

  getDaysBetween(date1: Date, date2: Date) {
    const momentDate1 = moment(date1);
    const momentDate2 = moment(date2);
    return Math.abs(momentDate2.diff(momentDate1, 'days'));
  }

  async randomWinnersSplEvent(
    event: EventEntity,
    entityType: string,
    userId: string,
  ) {
    const audienceList = await this.userService.getAudienceList(
      event.audienceId,
      entityType,
    );
    const winnerIds: string[] = this.getRandomWinners(
      audienceList,
      event.rules.winner.selectionNumber,
    );
    const prizeList: Prize[] = this.getRandomRewards(
      event.rules.reward.random,
      winnerIds.length,
    );
    await this.saveWinnersFromLists(
      winnerIds,
      prizeList,
      event,
      entityType,
      userId,
      false,
    );
  }

  async conditionalWinnersSplEvent(
    event: EventEntity,
    entityType: string,
    userId,
  ) {
    const audienceList = await this.userService.getAudienceList(
      event.audienceId,
      entityType,
    );
    const currDate = new Date();
    const orders = await this.orderService.getOrdersFromStoreIdsAndDeliveryDate(
      audienceList,
      currDate.toISOString().slice(0, 10),
    );

    const aggregateObjectMap = new Map<string, SplAggregate>();
    this.aggregateOrders(aggregateObjectMap, orders);

    const winnerIds = await this.segregateConditionalWinners(
      event.rules.winner.conditions,
      aggregateObjectMap,
    );
    const prizeList = await this.conditionalWinnerPrizes(
      event.rules.reward.conditional,
      winnerIds.length,
    );
    await this.saveWinnersFromLists(
      winnerIds,
      prizeList,
      event,
      entityType,
      userId,
      false,
    );
  }

  private aggregateOrders(
    aggregateObjectMap: Map<string, SplAggregate>,
    franchiseOrders: FranchiseOrderEntity[],
  ) {
    for (const franchiseOrder of franchiseOrders) {
      if (aggregateObjectMap.has(franchiseOrder.storeId)) {
        aggregateObjectMap.get(franchiseOrder.storeId).finalBillAmount +=
          Number(franchiseOrder.finalBillAmount);
      } else {
        aggregateObjectMap.set(
          franchiseOrder.storeId,
          new SplAggregate(
            franchiseOrder.storeId,
            Number(franchiseOrder.finalBillAmount),
          ),
        );
      }
    }
  }

  private async saveWinnersFromLists(
    winnerIds: string[],
    prizeList: Prize[],
    event: EventEntity,
    entityType: string,
    userId: string,
    addPositions: boolean,
  ) {
    const winnerList: WinnerEntity[] = [];
    for (let i = 0; i < winnerIds.length; i++) {
      const winner = WinnerEntity.createNewWinner(
        event.id,
        winnerIds.at(i),
        entityType,
        addPositions ? i + 1 : null,
        prizeList.at(i),
        new Date(),
        userId,
      );
      winnerList.push(winner);
    }
    await this.saveWinners(winnerList);
  }

  private async conditionalWinnerPrizes(prizeList: Prize[], length: number) {
    const winnerPrizeList: Prize[] = [];
    for (let i = 0; i < length; i++) {
      winnerPrizeList.push(prizeList.at(0));
    }
    return winnerPrizeList;
  }

  async meritWinnersSplEvent(event: EventEntity, entityType: string, userId) {
    const audienceList = await this.userService.getAudienceList(
      event.audienceId,
      entityType,
    );
    const currDate = new Date();
    const orders = await this.orderService.getOrdersFromStoreIdsAndDeliveryDate(
      audienceList,
      currDate.toISOString().slice(0, 10),
    );

    const aggregateObjectMap = new Map<string, SplAggregate>();
    this.aggregateOrders(aggregateObjectMap, orders);

    const winnerIds = await this.findMeritWinners(
      event.rules.winner.meritOrder,
      event.rules.winner.selectionNumber,
      Array.from(aggregateObjectMap.values()),
    );
    await this.saveWinnersFromLists(
      winnerIds,
      event.rules.reward.merit,
      event,
      entityType,
      userId,
      true,
    );
  }

  private async findMeritWinners(
    meritOrder: string[],
    selectionNumber: number,
    splAggregates: SplAggregate[],
  ) {
    splAggregates.sort((candidate1, candidate2) => {
      for (const comp of meritOrder) {
        if (candidate1[comp] === candidate2[comp]) {
          continue;
        }
        return candidate2[comp] - candidate1[comp];
      }
      return 0;
    });
    return splAggregates
      .map((aggregate) => aggregate.storeId)
      .slice(0, selectionNumber);
  }

  async meritWinnersLeaderboardEvent(event: EventEntity) {
    const audienceList = await this.userService.getAudienceList(
      event.audienceId,
      'STORE',
    );
    const currDate = new Date();
    const nextDate = new Date();
    nextDate.setDate(currDate.getDate() + 1);

    const orders =
      await this.orderService.getOrdersFromStoreIdsAndDeliveryDateRange(
        audienceList,
        currDate.toISOString().slice(0, 10),
        nextDate.toISOString().slice(0, 10),
      );
    const aggregateObjectMap = new Map<string, SplAggregate>();
    this.aggregateOrders(aggregateObjectMap, orders);
    return await this.sortByMeritRules(
      event.rules.winner.meritOrder,
      Array.from(aggregateObjectMap.values()),
    );
  }

  private async sortByMeritRules(
    meritOrder: string[],
    splAggregates: SplAggregate[],
  ) {
    splAggregates.sort((candidate1, candidate2) => {
      for (const comp of meritOrder) {
        if (candidate1[comp] === candidate2[comp]) {
          continue;
        }
        return candidate2[comp] - candidate1[comp];
      }
      return 0;
    });
    return splAggregates;
  }
}
