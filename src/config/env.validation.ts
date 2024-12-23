import { InternalServerErrorException } from '@nestjs/common';
import { Expose, plainToClass } from 'class-transformer';
import { IsEnum, validateSync, IsNotEmpty } from 'class-validator';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

export class EnvironmentVariables {
  @Expose()
  @IsEnum(Environment)
  ENV!: Environment;

  @Expose()
  PORT!: string;

  @IsNotEmpty()
  @Expose()
  DATABASE_HOST!: string;

  @Expose()
  DATABASE_PORT?: string;

  @Expose()
  DATABASE_USERNAME?: string;

  @Expose()
  DATABASE_PASSWORD?: string;

  @Expose()
  DATABASE_NAME?: string;

  @Expose()
  UTIL_URL?: string;

  @Expose()
  UTIL_TOKEN?: string;

  @Expose()
  WAREHOUSE_DATABASE?: string;

  @Expose()
  WAREHOUSE_DATABASE_PORT?: string;

  @Expose()
  WAREHOUSE_DATABASE_HOST?: string;

  @Expose()
  WAREHOUSE_DATABASE_USERNAME?: string;

  @Expose()
  WAREHOUSE_DATABASE_PASSWORD?: string;

  @Expose()
  ROUTE_CAPACITY?: string;

  @Expose()
  CLEVERTAP_URL?: string;

  @Expose()
  CLEVERTAP_PASS_CODE?: string;

  @Expose()
  CLEVERTAP_ACCOUNT_ID?: string;

  @Expose()
  GOOGLE_MAPS_API_KEY?: string;
}

export function validate(config: Record<string, unknown>) {
  const transformedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
  });

  const errors = validateSync(transformedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new InternalServerErrorException(errors.toString());
  }

  return transformedConfig;
}
