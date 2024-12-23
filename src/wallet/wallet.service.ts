import { In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { WalletEntity } from './wallet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from '../order/order.entity';
import { WalletStatementEntity } from './wallet-statement.entity';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class WalletService {
  private readonly logger = new CustomLogger(WalletService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(WalletEntity)
    private readonly walletEntityRepository: Repository<WalletEntity>,
  ) {}

  async createUserStoreMapping(user_id: string, store_id: string) {
    return true;
  }

  async getAllUserWallets(userIdList: string[]) {
    const UserWallets = await this.walletEntityRepository.find({
      where: { entity_id: In(userIdList), active: 1 },
    });
    return UserWallets;
  }

  createWalletStatementEntity(
    cart: OrderEntity,
    txnMode: string,
    txnType: string,
    balance: string,
    entityType: string,
  ): WalletStatementEntity {
    const walletStatementObject = {
      entity_id: cart.customer_id,
      amount: cart.final_bill_amount,
      txn_mode: txnMode,
      txn_type: txnType,
      balance: balance,
      txn_detail: cart.display_order_id,
      entity_type: entityType,
      active: 1,
      created_at: new Date(Date.now()),
      created_by: '01b6686b-6c23-4614-ad0b-9bd21fd2a146',
      modified_at: new Date(Date.now()),
      modified_by: '01b6686b-6c23-4614-ad0b-9bd21fd2a146',
    } as WalletStatementEntity;
    const walletStatementEntity = new WalletStatementEntity();
    Object.assign(walletStatementEntity, walletStatementObject);
    return walletStatementEntity;
  }
}
