import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SplEventDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  eventIds: number[];
}
