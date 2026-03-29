import { Module } from '@nestjs/common';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { AuthModule } from 'src/domains/auth/auth.module';
import { AppConfigModule } from 'src/config/app-config.module';
import { ProvidersModule } from 'src/providers/providers.module';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [AppConfigModule, AuthModule, ProvidersModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
