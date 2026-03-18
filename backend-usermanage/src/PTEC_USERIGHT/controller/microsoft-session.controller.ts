// src/controllers/microsoft-session.controller.ts - แก้ใหม่
import {
  Controller,
  Post,
  Get,
  // Delete,
  Body,
  Headers,
  HttpStatus,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { MicrosoftSessionService } from '../service/Microsoft-session.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { User } from '../dto/ptec_useright.dto';

@Controller('microsoft-session')
export class MicrosoftSessionController {
  constructor(
    private readonly microsoftSessionService: MicrosoftSessionService,
  ) {}

  /**
   * บันทึก Microsoft token ลง database
   * เรียกจาก frontend หลัง login Microsoft สำเร็จ
   */
  @Public()
  @Post('/save')
  async saveSession(
    @Body()
    body: {
      sessionId: string;
      microsoftToken: string;
      email: string;
      name: string;
      source?: string;
    },
    @Res() res: Response,
  ) {
    try {
      const {
        sessionId,
        microsoftToken,
        email,
        name,
        source = 'portal',
      } = body;

      if (!sessionId || !microsoftToken || !email) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'sessionId, microsoftToken, and email are required',
        });
      }

      const result = await this.microsoftSessionService.saveSession({
        sessionId,
        microsoftToken,
        email,
        name,
        source,
      });

      // Parse userData เพื่อส่งกลับไป frontend
      const sessionData = JSON.parse(result.userData) as User;

      return res.status(HttpStatus.OK).json({
        success: true,
        sessionId: result.sessionId,
        userData: sessionData,
      });
    } catch (error) {
      console.error('Save session error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * ดึง Microsoft token จาก session ID
   * เรียกจาก middleware/guard เมื่อต้องการ validate
   */
  @Public()
  @Get('/token')
  async getToken(
    @Headers('x-session-id') sessionId: string,
    @Res() res: Response,
  ) {
    try {
      if (!sessionId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Session ID is required',
        });
      }

      const token =
        await this.microsoftSessionService.getTokenBySessionId(sessionId);

      if (!token) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Session not found or expired',
        });
      }

      // ดึงข้อมูล user จาก Microsoft
      const userInfo = await this.microsoftSessionService.getUserInfo(token);

      return res.status(HttpStatus.OK).json({
        success: true,
        token,
        userInfo,
      });
    } catch (error) {
      console.error('Get token error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * เช็คว่า session ยังใช้งานได้ไหม
   */
  @Public()
  @Get('/check')
  async checkSession(
    // @Headers('x-session-id') sessionId: string,
    @Query('accept_token') accept_token: string,
    @Res() res: Response,
  ) {
    try {
      if (!accept_token) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Accept token is required',
        });
      }

      const isValid =
        await this.microsoftSessionService.validateSession(accept_token);

      return res.status(HttpStatus.OK).json({
        success: true,
        valid: isValid,
      });
    } catch (error) {
      console.error('Check session error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Logout - ลบ session
   */
  // @Public()
  // @Delete('/logout')
  // async logout(
  //   @Headers('x-session-id') sessionId: string,
  //   @Res() res: Response,
  // ) {
  //   try {
  //     if (!sessionId) {
  //       return res.status(HttpStatus.BAD_REQUEST).json({
  //         success: false,
  //         message: 'Session ID is required',
  //       });
  //     }

  //     await this.microsoftSessionService.revokeSession(sessionId);

  //     return res.status(HttpStatus.OK).json({
  //       success: true,
  //       message: 'Logged out successfully',
  //     });
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //     return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
  //       success: false,
  //       message: 'Internal server error',
  //     });
  //   }
  // }
}
