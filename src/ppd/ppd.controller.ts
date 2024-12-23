import { Controller, Post, UseFilters } from '@nestjs/common';
import { PpdService } from './ppd.service';
import { HttpExceptionFilter } from '../core/http-exception.filter';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller('process')
@UseFilters(HttpExceptionFilter)
export class PpdController {
  private readonly logger = new CustomLogger(PpdController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private ppdService: PpdService,
  ) {}

  @Post('/ppd-cron')
  async ppdCron() {
    const aa = await this.ppdService.startPpdCron();
    return true;
  }

  @Post('/ppd-assignment')
  async ppdPickersPackersSupervisorsAssignment() {
    const aa = await this.ppdService.startPickersPackersSupervisorsAssignment();
    return true;
  }
}
