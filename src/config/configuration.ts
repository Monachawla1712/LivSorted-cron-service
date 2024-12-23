import { EnvironmentVariables } from './env.validation';

export interface Config {
  appEnv: string;
  port: string;
  db_host: string;
  db_port: string;
  db_username: string;
  db_password: string;
  db_name: string;
  util_url: string;
  util_token: string;
  warehouse_database: string;
  warehouse_database_port: string;
  warehouse_database_host: string;
  warehouse_database_username: string;
  warehouse_database_password: string;
  route_capacity: string;
  clevertap_url: string;
  clevertap_passCode: string;
  clevertap_user: string;
  google_maps_api_key: string;
}

export default (): Config => {
  const processEnv = process.env as unknown as EnvironmentVariables;
  return {
    appEnv: processEnv.ENV,
    port: processEnv.PORT || '3001',
    db_host: processEnv.DATABASE_HOST,
    db_port: processEnv.DATABASE_PORT,
    db_username: processEnv.DATABASE_USERNAME,
    db_password: processEnv.DATABASE_PASSWORD,
    db_name: processEnv.DATABASE_NAME,
    util_url: processEnv.UTIL_URL,
    util_token: processEnv.UTIL_TOKEN,
    warehouse_database: processEnv.WAREHOUSE_DATABASE,
    warehouse_database_port: processEnv.WAREHOUSE_DATABASE_PORT,
    warehouse_database_host: processEnv.WAREHOUSE_DATABASE_HOST,
    warehouse_database_username: processEnv.WAREHOUSE_DATABASE_USERNAME,
    warehouse_database_password: processEnv.WAREHOUSE_DATABASE_PASSWORD,
    route_capacity: processEnv.ROUTE_CAPACITY,
    clevertap_url: processEnv.CLEVERTAP_URL,
    clevertap_passCode: processEnv.CLEVERTAP_PASS_CODE,
    clevertap_user: processEnv.CLEVERTAP_ACCOUNT_ID,
    google_maps_api_key: processEnv.GOOGLE_MAPS_API_KEY,
  };
};
