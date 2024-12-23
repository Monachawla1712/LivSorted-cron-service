import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  toTimestamp(strDate): number {
    const datum = Date.parse(strDate) / 1000;
    return datum;
  }
}
