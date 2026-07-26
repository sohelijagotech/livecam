import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'liveconnect',
  password: process.env.DB_PASSWORD || 'liveconnect_password',
  database: process.env.DB_NAME || 'liveconnect',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: process.env.DB_SYNCHRONIZE !== 'false',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  logging: false,
});
