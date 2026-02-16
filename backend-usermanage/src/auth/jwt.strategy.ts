// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { jwtConstants } from '../PTEC_USERIGHT/config/jwt.config';
import { JwtPayload } from 'src/PTEC_USERIGHT/domain/model/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AuthSession } from 'src/PTEC_USERIGHT/domain/model/auth-session.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(AuthSession, 'auth')
    private readonly sessionRepo: Repository<AuthSession>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    if (!payload || (!payload.sub && !payload.userId)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // ดึง token จาก header
    const authHeader = request.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // เช็คใน database ว่า token ถูก revoke หรือยัง
    const session = await this.sessionRepo.findOne({
      where: {
        accessToken: token,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!session) {
      throw new UnauthorizedException('Token has been revoked or expired');
    }

    // Update last access time
    session.lastAccessAt = new Date();
    await this.sessionRepo.save(session);

    // Return user data
    return {
      userId: payload.userId || payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
