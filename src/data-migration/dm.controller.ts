import {Controller, Post, UseFilters, Headers, BadRequestException} from '@nestjs/common';
import { HttpExceptionFilter } from '../core/http-exception.filter';
import { DmService } from './dm.service';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller('process')
@UseFilters(HttpExceptionFilter)
export class DmController {
  private readonly logger = new CustomLogger(DmController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private dmService: DmService,
  ) {}

  @Post('/migrate/wh_skus')
  async migrateWhSkus() {
    await this.dmService.migrateWhSkus();
  }

  @Post('/migrate/store_secondary_picking')
  async migrateStoreSecondaryPicking() {
    await this.dmService.migrateStoreSecondaryPicking();
  }

  @Post('/migrate/tickets-l3-data')
  async migrateL3TicketsData() {
    return await this.dmService.migrateTicketItemsL3ToWh();
  }

  @Post('/migrate/sr-skus')
  async migrateSsSKusData() {
    return await this.dmService.migrateSrSkusDataToPg();
  }

  @Post('/migrate/dsr-info')
  async migrateDsInventoryInfo(@Headers('date') date: string) {
    let parsedDate: Date;
    if (date) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
    }
    return await this.dmService.migrateDsrInfoToPg(parsedDate);
  }

}
