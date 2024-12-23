import { Module } from '@nestjs/common';
import { CommonService } from '../core/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletEntity } from './wallet.entity';
import { WalletStatementEntity } from './wallet-statement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WalletEntity, WalletStatementEntity])],
  providers: [WalletService, CommonService],
})
export class WalletModule {}
