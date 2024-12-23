import { Module } from '@nestjs/common';
import { CommonService } from '../core/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { ConfigService } from '@nestjs/config';
import { AudienceEntity } from '../user/audience.entity';
import { UserAudienceEntity } from '../user/user-audience.entity';
import { WinnerEntity } from './winner.entity';
import { EventEntity } from './event.entity';
import { Engine } from 'json-rules-engine';
import { UserService } from '../user/user.service';
import { OrderService } from '../order/order.service';
import { FranchiseOrderEntity } from '../order/franchise-order.entity';
import { OrderEntity } from '../order/order.entity';
import { OrderItemsEntity } from '../order/order-items.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletEntity } from '../wallet/wallet.entity';
import { WalletStatementEntity } from '../wallet/wallet-statement.entity';
import { SuggestionEntity } from '../suggestions/suggestions.entity';
import { StoreService } from '../store/store.service';
import { StoreEntity } from '../store/store.entity';
import { EventParamsEntity } from './event-params.entity';
import { EventParamsService } from './event-params.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AudienceEntity,
      UserAudienceEntity,
      WinnerEntity,
      EventEntity,
      FranchiseOrderEntity,
      OrderEntity,
      OrderItemsEntity,
      WalletEntity,
      WalletStatementEntity,
      SuggestionEntity,
      StoreEntity,
      EventParamsEntity,
    ]),
  ],
  providers: [
    EventsService,
    CommonService,
    ConfigService,
    Engine,
    UserService,
    OrderService,
    WalletService,
    StoreService,
    EventParamsService,
  ],
  controllers: [EventsController],
})
export class EventsModule {}
