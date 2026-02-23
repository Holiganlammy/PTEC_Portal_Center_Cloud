import { Module } from '@nestjs/common';
import { AppController } from './controller/ptec_useright.controller';
import { AppService } from './service/ptec_useright.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { jwtConstants } from './config/jwt.config';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule } from '@nestjs/config';
// import { PassportModule } from '@nestjs/passport';
// import { JwtStrategy } from '../auth/jwt.strategy';
// import { APP_GUARD } from '@nestjs/core';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthSessionService } from './service/auth-session.service';
import { AuthSession } from './domain/model/auth-session.entity';
import { AuthModule } from '../auth/auth.module';
import { redisProvider } from '../redis/redis.provider';
import { DatabaseManagerModule } from 'src/database/database-manager.module';
import { SessionCleanupService } from './service/session-cleanup.service';
import { MicrosoftSessionController } from './controller/microsoft-session.controller';
import { MicrosoftSessionService } from './service/Microsoft-session.service';

@Module({
  imports: [
    DatabaseManagerModule,
    AuthModule,
    TypeOrmModule.forFeature([AuthSession], 'auth'),
  ],
  controllers: [AppController, MicrosoftSessionController],
  providers: [
    AppService,
    AuthSessionService,
    redisProvider,
    SessionCleanupService,
    MicrosoftSessionService,
  ],
  exports: [AppService, AuthSessionService],
})
export class PTEC_USERRIGHT_Module {}
