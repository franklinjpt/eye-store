import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { TransactionsModule } from './transactions/transactions.module';
import { HealthController } from './health/health.controller';

const useInMemory =
  process.env.NODE_ENV === 'test' || process.env.SKIP_DB === 'true';

const typeOrmImports = useInMemory
  ? []
  : [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'eye_store',
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    ];

@Module({
  imports: [ConfigModule.forRoot(), ...typeOrmImports, ProductsModule, TransactionsModule],
  controllers: [HealthController],
})
export class AppModule {}
