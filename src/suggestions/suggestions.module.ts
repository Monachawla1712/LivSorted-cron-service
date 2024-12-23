import { Module } from '@nestjs/common';
import { CommonService } from '../core/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { ConfigService } from '@nestjs/config';
import { AudienceEntity } from '../user/audience.entity';
import { UserAudienceEntity } from '../user/user-audience.entity';
import { SuggestionEntity } from './suggestions.entity';
import { Engine } from 'json-rules-engine';
import { UserService } from '../user/user.service';
import { OrderService } from '../order/order.service';
import { FranchiseOrderEntity } from '../order/franchise-order.entity';
import { OrderEntity } from '../order/order.entity';
import { OrderItemsEntity } from '../order/order-items.entity';
import { WalletService } from '../wallet/wallet.service';
import { WalletEntity } from '../wallet/wallet.entity';
import { WalletStatementEntity } from '../wallet/wallet-statement.entity';
import { OrderParamsService } from '../order-params/order-params.service';
import { OrderParamsEntity } from '../order-params/order-params.entity';
import { StoreService } from '../store/store.service';
import { StoreEntity } from '../store/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AudienceEntity,
      UserAudienceEntity,
      SuggestionEntity,
      FranchiseOrderEntity,
      OrderEntity,
      OrderItemsEntity,
      WalletEntity,
      WalletStatementEntity,
      OrderParamsEntity,
      StoreEntity,
    ]),
  ],
  providers: [
    SuggestionsService,
    CommonService,
    ConfigService,
    Engine,
    UserService,
    OrderService,
    WalletService,
    OrderParamsService,
    StoreService,
  ],
  controllers: [SuggestionsController],
})
export class SuggestionsModule {}
