import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/configuration';
import { ClevertapPushbean } from '../../order/classes/clevertap-push.bean';
import { CustomLogger } from '../custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class NotificationService {
  private readonly logger = new CustomLogger(NotificationService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private httpService: HttpService,
    private configService: ConfigService<Config, true>,
  ) {}

  async sendCleverTapNotification(clevertapEventRequest: ClevertapPushbean) {
    try {
      await firstValueFrom(
        this.httpService.request({
          method: 'POST',
          baseURL: this.configService.get<string>('util_url'),
          url: '/notification/clevertap',
          headers: {
            'content-type': 'application/json',
            Authorization: this.configService.get<string>('util_token'),
          },
          data: clevertapEventRequest,
        }),
      );
    } catch (e) {}
  }
}
