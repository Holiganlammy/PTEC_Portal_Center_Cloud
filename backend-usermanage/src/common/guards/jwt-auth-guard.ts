// src/auth/guards/jwt-auth.guard.ts
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthSession } from 'src/PTEC_USERIGHT/domain/model/auth-session.entity';
import * as jwt from 'jsonwebtoken';
import { jwtConstants } from '../../PTEC_USERIGHT/config/jwt.config';
import { Request } from 'express';

interface JwtInfo {
  name?: string;
  message?: string;
}

interface SessionData {
  userId: number;
  userCode: string;
  username: string;
  role: number;
  email: string;
  branchid: number;
  depid: number;
  source: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @InjectRepository(AuthSession, 'auth')
    private readonly sessionRepo: Repository<AuthSession>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // ดึง token จาก request
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // ตรวจสอบว่าเป็น JWT ของระบบหรือไม่
    const isSystemJwt = this.isSystemJwtToken(token);

    if (!isSystemJwt) {
      // กรณีเป็น Microsoft Token - ตรวจสอบจาก session
      const session = await this.sessionRepo
        .createQueryBuilder()
        .where('accessToken = :token', { token })
        .andWhere('isRevoked = :revoked', { revoked: false })
        .andWhere('expiresAt > :now', { now: new Date() })
        .getOne();
      // .findOne({
      //   where: {
      //     accessToken: token,
      //     isRevoked: false,
      //     expiresAt: MoreThan(new Date()),
      //   },
      // });

      if (!session) {
        throw new UnauthorizedException(
          'Microsoft token And Token Credentials not found or expired',
        );
      }

      session.lastAccessAt = new Date();
      await this.sessionRepo.save(session);
      const userData = JSON.parse(session.userData) as SessionData;
      request.user = {
        userId: userData.userId,
        username: userData.username,
        userCode: userData.userCode,
        role: userData.role,
        email: userData.email,
        branchid: userData.branchid,
        depid: userData.depid,
        source: userData.source,
      } as Express.User;

      return true;
    }

    // กรณีเป็น JWT ของระบบ - ทำงานแบบเดิม
    const canActivate = super.canActivate(context);

    if (canActivate instanceof Promise) {
      return canActivate.catch((err) => {
        throw err; // ให้ไปที่ handleRequest
      });
    }

    return canActivate as boolean;
  }

  /**
   * ตรวจสอบว่า token เป็น JWT ของระบบหรือไม่
   */
  private isSystemJwtToken(token: string): boolean {
    try {
      jwt.verify(token, jwtConstants.secret);
      return true;
    } catch {
      return false;
    }
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    // console.log('🔐 handleRequest ถูกเรียก');
    // console.log('Error:', err);
    // console.log('User:', user);
    // console.log('Info:', info);
    // console.log('Info name:', (info as JwtInfo)?.name);

    // ถ้ามี error หรือไม่มี user
    if (err || !user) {
      let customResponse;

      // Token หมดอายุ
      if ((info as JwtInfo)?.name === 'TokenExpiredError') {
        console.log('⏰ Token หมดอายุ');
        customResponse = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Token has expired. Please login again.',
          tokenExpired: true,
          timestamp: new Date().toISOString(),
        };
      }
      // Token ไม่ถูกต้อง
      else if ((info as JwtInfo)?.name === 'JsonWebTokenError') {
        console.log('❌ Token ไม่ถูกต้อง');
        customResponse = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid token format.',
          tokenInvalid: true,
          timestamp: new Date().toISOString(),
        };
      }
      // Token signature ไม่ถูกต้อง
      else if ((info as JwtInfo)?.name === 'NotBeforeError') {
        customResponse = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Token not active yet.',
          tokenNotActive: true,
          timestamp: new Date().toISOString(),
        };
      }
      // ไม่มี token หรือ error อื่นๆ
      else {
        customResponse = {
          statusCode: 401,
          error: 'Unauthorized',
          message:
            (info as JwtInfo)?.message ||
            'Authentication required. No valid token provided.',
          noToken: true,
          timestamp: new Date().toISOString(),
        };
      }

      throw new UnauthorizedException(customResponse);
    }

    return user as TUser;
  }
}
