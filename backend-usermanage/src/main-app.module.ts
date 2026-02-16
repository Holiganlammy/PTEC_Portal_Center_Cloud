// src/main-app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PTEC_USERRIGHT_Module } from './PTEC_USERIGHT/app.module';
import { PTEC_OPS_SMART_Module } from './PTEC_OPS_SMART/app.module';
import { PTEC_Menu_Module } from './PTEC_MENU/app.module';
import { PTEC_FA_Module } from './PTEC_FA/app.module';
import { PTEC_RESERVATION_SYSTEMS_Module } from './PTEC_RESERVATION_SYSTEMS/app.module';
import { AuthModule } from './auth/auth.module';
import { AuthSession } from './PTEC_USERIGHT/domain/model/auth-session.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    ScheduleModule.forRoot(),
    // Connection 1: default (Main - 4 modules)
    TypeOrmModule.forRootAsync({
      name: 'default', // ✅ เพิ่ม name
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql' as const,
        host: configService.get<string>('DB_SERVER') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '1433'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME_OF_OPS'),
        entities: [
          __dirname + '/PTEC_FA/**/*.entity{.ts,.js}',
          __dirname + '/PTEC_MENU/**/*.entity{.ts,.js}',
          __dirname + '/PTEC_OPS_SMART/**/*.entity{.ts,.js}',
          __dirname + '/PTEC_RESERVATION_SYSTEMS/**/*.entity{.ts,.js}',
        ],

        synchronize: false,

        options: {
          encrypt: true,
          trustServerCertificate: true,
          enableArithAbort: true,
        },

        pool: {
          max: 10,
          min: 2,
          idleTimeoutMillis: 30000,
        },

        // logging: process.env.NODE_ENV === 'development',
      }),
    }),

    // Connection 2: auth
    TypeOrmModule.forRootAsync({
      name: 'auth',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql' as const,
        host: configService.get<string>('DB_SERVER') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '1433'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME_OF_AUTH') || 'PTEC_AUTH',
        entities: [AuthSession],
        synchronize: false,

        options: {
          encrypt: true,
          trustServerCertificate: true,
          enableArithAbort: true,
        },

        pool: {
          max: 5,
          min: 1,
          idleTimeoutMillis: 30000,
        },

        // logging: true, // ✅ เปิด logging
      }),
    }),

    // Connection 3: users
    TypeOrmModule.forRootAsync({
      name: 'users',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql' as const,
        host: configService.get<string>('DB_SERVER') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '1433'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME_OF_USERS'),
        entities: [
          __dirname +
            '/PTEC_USERIGHT/domain/model/ptec_useright.entity{.ts,.js}',
        ],

        synchronize: false,

        options: {
          encrypt: true,
          trustServerCertificate: true,
          enableArithAbort: true,
        },

        pool: {
          max: 10,
          min: 2,
          idleTimeoutMillis: 30000,
        },

        // logging: process.env.NODE_ENV === 'development',
      }),
    }),

    AuthModule,
    PTEC_USERRIGHT_Module,
    PTEC_OPS_SMART_Module,
    PTEC_Menu_Module,
    PTEC_FA_Module,
    PTEC_RESERVATION_SYSTEMS_Module,
  ],
})
export class MainAppModule {}
