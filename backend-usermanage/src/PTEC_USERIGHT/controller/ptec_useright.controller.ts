import {
  Get,
  Post,
  Res,
  Controller,
  Body,
  Query,
  Inject,
  HttpException,
  HttpStatus,
  Put,
  Param,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from '../service/ptec_useright.service';
import {
  ChangPasswordDto,
  CheckUserPermissionDto,
  GetUserWithRolesDto,
  LoginDto,
  resetPasswordDTO,
  VerifyOtpDto,
} from '../dto/Login.dto';
import { CreateUserDto } from '../dto/CreateUser.dto';
import { EditUserDto } from '../dto/EditUser.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { UAParser } from 'ua-parser-js';
import {
  Department,
  Position,
  Section,
  User,
  CreateUserResult,
} from '../domain/model/ptec_useright.entity';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';
// import { sendResetPasswordEmail } from 'src/utils/sendEmailForgetPassword';
import { sendOtpWithGmailAPI } from 'src/utils/sendEmailOTPLoginGmailAPI';
import { sendResetPasswordWithGmailAPI } from 'src/utils/sendEmailForgetPasswordGmailAPI';

@Controller('')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {}

  @Get('/users')
  async getUser(
    @Query('usercode') usercode?: string | null,
    @Query('UserID') UserID?: string | null,
  ) {
    const users = await this.appService.getUsersFromProcedure(
      usercode ? usercode : null,
      UserID ? Number(UserID) : null,
    );
    const filterOutUsers = users.map(({ ...user }) => user);
    return filterOutUsers;
  }

  @Public()
  @Post('/login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const password = loginDto.password;

      const hasUpperCase = /[A-Z]/.test(password);
      const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

      if (!hasUpperCase || !hasSpecialChar) {
        return res.status(400).json({
          success: false,
          message: 'ใส่รหัสผ่านต้องมีตัวอักษรใหญ่และอักขระพิเศษ',
        });
      }
      const resultLogin = await this.appService.getUserLogin(loginDto);
      const user = resultLogin[0] as User;
      console.log('User fetched on login:', user);
      if (!user || user.password !== 1) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          credentials: false,
        });
      }

      const cookies = req.cookies as Record<string, string> | undefined;
      const trustedId = cookies?.trusted_device;

      if (trustedId && trustedId.trim() !== '') {
        const userAgent = req.headers['user-agent'] || 'unknown';
        const ipAddress =
          req.ip ||
          (req.headers['x-forwarded-for'] as string | undefined)?.split(
            ',',
          )[0] ||
          'unknown';

        const isTrusted = await this.appService.checkTrustedDevice({
          userCode: user.UserCode,
          deviceId: trustedId,
          userAgent,
          ipAddress,
        });

        if (isTrusted === true) {
          const payload = {
            sub: user.UserCode, // ✅ เพิ่ม sub field
            userId: user.UserID,
            username: user.UserCode,
            role: user.role_id, // 1.Admin 2.User 3.Moderator FA 4.Moderator SM 5.Guest 6.Moderrator Reservation Sys 7.Mockup User
          };

          const token = this.appService['jwtService'].sign(payload);
          return res.status(200).json({
            success: true,
            access_token: token,
            user,
            message: 'Login successful with trusted device',
          });
        }
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const key = `mfa:${user.UserCode}`;
      // console.log('Generated OTP for key on login:', key);
      const ttl = 300; // 5 นาที

      await this.redis.setex(key, ttl, otp);
      const savedOtp = await this.redis.get(key);
      console.log(`Verify saved OTP on login: ${savedOtp}`);
      try {
        await sendOtpWithGmailAPI(user.Email, otp, user);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        throw new HttpException(
          'Failed to send OTP email',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const expiresAt = Date.now() + ttl * 1000;

      return res.status(200).json({
        success: true,
        request_Mfa: true,
        userCode: user.UserCode,
        message: 'OTP sent to your email',
        expiresAt,
      });
    } catch (error: unknown) {
      console.error('Login error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post('/resend-otp')
  async resendOtp(@Body() body: { usercode: string }, @Res() res: Response) {
    const usercode = body.usercode.toUpperCase();

    const resultLogin = await this.appService.getUsersFromProcedure(usercode);
    const user = resultLogin[0];

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = 300; // 5 minutes
    const key = `mfa:${usercode}`;
    await this.redis.setex(key, ttl, otp);
    await sendOtpWithGmailAPI(user.Email, otp, user);

    return res.status(200).json({
      success: true,
      message: 'OTP resent',
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  private getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    if (xForwardedFor) {
      const ip = xForwardedFor.split(',')[0].trim();
      if (ip === '::1') return '127.0.0.1';
      if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
      return ip;
    }

    const ip = req.socket?.remoteAddress || req.ip || '';

    // แปลง IPv6 localhost เป็น IPv4
    if (ip === '::1') return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    return ip;
  }

  @Public()
  @Post('/verify-otp')
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const { usercode, otpCode, trustDevice } = body;
    const key = `mfa:${usercode.toUpperCase()}`;
    // console.log('Verifying OTP for key on verify-otp:', key);

    const storedOtp = await this.redis.get(key);
    // console.log('Stored OTP:', storedOtp);
    // console.log('Provided OTP:', otpCode);
    if (!storedOtp || storedOtp !== otpCode) {
      return res.status(401).json({
        success: false,
        error: 'OTP_INVALID',
        message: 'Invalid or expired OTP',
      });
    }

    await this.redis.del(key);

    const resultLogin: User[] =
      await this.appService.getUsersFromProcedure(usercode);
    const user = resultLogin[0];
    const payload = {
      sub: user.UserCode, // ✅ เพิ่ม sub field
      userId: user.UserID,
      username: user.UserCode,
      role: user.role_id,
    };
    const token = this.appService['jwtService'].sign(payload);
    if (trustDevice === true || trustDevice === 'true') {
      const trustedId = crypto.randomUUID();
      const userAgent = req.headers['user-agent'] || 'unknown';

      const ipAddress = this.getClientIp(req);
      if (!ipAddress || ipAddress === '' || ipAddress === 'unknown') {
        console.warn('Could not determine client IP address');
      }
      const parser = new UAParser();
      const uaResult = parser.setUA(userAgent).getResult();

      let deviceType = 'desktop';
      if (uaResult.device.type) {
        deviceType = uaResult.device.type;
      } else if (uaResult.device.model || uaResult.device.vendor) {
        deviceType = 'mobile';
      } else if (userAgent.toLowerCase().includes('mobile')) {
        deviceType = 'mobile';
      }

      const deviceInfo = {
        browser: uaResult.browser.name || '',
        os: uaResult.os.name || '',
        deviceType: deviceType,
      };
      await this.appService.saveTrustedDevice({
        userCode: user.UserCode,
        deviceId: trustedId,
        userAgent,
        ipAddress,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        deviceType: deviceInfo.deviceType,
      });
      res.cookie('trusted_device', trustedId, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    return res.status(200).json({
      success: true,
      access_token: token,
      user,
    });
  }

  @Post('/user/create')
  async createUser(@Body() createUser: CreateUserDto, @Res() res: Response) {
    try {
      const result: CreateUserResult[] =
        await this.appService.createUser(createUser);

      if (result && result.length > 0) {
        const status = result[0].status;

        if (status === 'success') {
          return res.status(200).json({
            success: true,
            message: result[0].message ?? 'User created successfully',
            user: result[0],
          });
        }

        if (status === 'duplicate') {
          return res.status(409).json({
            success: false,
            message: result[0].message ?? 'User already exists',
            user: result[0],
            duplicate: true,
          });
        }

        if (status === 'error') {
          return res.status(500).json({
            success: false,
            message: result[0].message ?? 'Database error occurred',
          });
        }
      }

      return res.status(500).json({
        success: false,
        message: 'No response from stored procedure',
      });
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error creating user',
      });
    }
  }

  @Get('/branch')
  async getBranch(@Res() res: Response) {
    try {
      const branches = await this.appService.getBranch();
      res.status(200).send({
        success: true,
        data: branches,
      });
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).send({
        success: false,
        message: 'Error fetching branches',
      });
    }
  }

  @Get('/department')
  async getDepartment(@Res() res: Response) {
    try {
      const departments = await this.appService.getDepartment();
      const filterDepartments = departments.filter(
        (dept: Department) => dept.branchid !== 0,
      );
      res.status(200).send({
        success: true,
        data: filterDepartments,
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).send({
        success: false,
        message: 'Error fetching departments',
      });
    }
  }

  @Get('/section')
  async getSection(@Res() res: Response) {
    try {
      const sections = await this.appService.getSection();
      const filterSections = sections.filter((sec: Section) => sec.secid !== 0);
      res.status(200).send({
        success: true,
        data: filterSections,
      });
    } catch (error) {
      console.error('Error fetching sections:', error);
      res.status(500).send({
        success: false,
        message: 'Error fetching sections',
      });
    }
  }

  @Get('/position')
  async getPosition(@Res() res: Response) {
    try {
      const positions = await this.appService.getPosition();
      const filterPositions = positions.filter(
        (pos: Position) => pos.positionid !== 0,
      );
      res.status(200).send({
        success: true,
        data: filterPositions,
      });
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).send({
        success: false,
        message: 'Error fetching positions',
      });
    }
  }

  @Put('/user/:id')
  async getUserById(
    @Param('id') id: string,
    @Body() editUserDto: EditUserDto,
    @Res() res: Response,
  ) {
    try {
      const user = await this.appService.editUser(id, editUserDto);
      if (user) {
        res.status(200).send({
          success: true,
          user,
        });
      } else {
        res.status(404).send({
          success: false,
          message: 'User not found',
        });
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).send({
        success: false,
        message: 'Error fetching user by ID',
      });
    }
  }

  @Put('/user/delete/:UserID')
  async deleteUser(
    @Param('UserID') UserID: string,
    @Body('actived') actived: string,
    @Res() res: Response,
  ) {
    try {
      await this.appService.changeStatus(UserID, actived);
      res.status(200).send({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send({
        success: false,
        message: 'Error deleting user',
      });
    }
  }

  @Post('/user/change-password')
  async changePassword(@Body() req: ChangPasswordDto, @Res() res: Response) {
    try {
      const result = await this.appService.changePassword(req);
      if (result) {
        res.status(200).send({
          success: true,
          message: 'Password changed successfully',
        });
      } else {
        res.status(404).send({
          success: false,
          message: 'User not found',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).send({
        success: false,
        message: 'Error changing password',
      });
    }
  }

  @Put('/user/activate/:UserID')
  async activateUser(
    @Param('UserID') UserID: string,
    @Body('actived') actived: string,
    @Res() res: Response,
  ) {
    try {
      await this.appService.changeStatus(UserID, actived);
      res.status(200).send({
        success: true,
        message: 'User status updated successfully',
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).send({
        success: false,
        message: 'Error updating user status',
      });
    }
  }

  @Public()
  @Post('/forget-password')
  async forgetPassword(
    @Body('Email') Email: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const ip = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const baseUrl = process.env.APP_URL;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      const result = await this.appService.forgetPassword({
        email: Email,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: ip,
        user_agent: userAgent,
      });

      if (result) {
        const { result: spResult, message, user_id, fullname } = result;

        if (spResult === 1 && user_id) {
          try {
            await sendResetPasswordWithGmailAPI(Email, fullname, resetLink);
          } catch (mailError) {
            console.error('❌ Failed to send email:', mailError);
          }
          res.status(200).send({
            success: true,
            message: 'Password reset email sent successfully',
          });
        } else {
          res.status(400).send({
            success: false,
            message: message || 'User not found',
          });
        }
      } else {
        res.status(500).send({
          success: false,
          message: 'Database error',
        });
      }
    } catch (error) {
      console.error('Error sending forgot password email:', error);
      res.status(500).send({
        success: false,
        message: 'Error sending forgot password email',
      });
    }
  }

  @Public()
  @Post('/validate-reset-token')
  async validateResetToken(@Body('token') token: string, @Res() res: Response) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest();
      const isValid = await this.appService.validateResetToken(tokenHash);
      if (isValid.isValid === true) {
        return res.status(200).send({
          success: true,
          message: 'Validate token successfully',
          UserID: isValid.UserID,
        });
      } else {
        return res.status(400).send({
          success: false,
          message: 'Invalid or expired token',
        });
      }
    } catch (err) {
      console.error('Token validation error:', err);
      return res.status(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  @Public()
  @Post('/reset-password')
  async resetPassword(@Body() req: resetPasswordDTO, @Res() res: Response) {
    try {
      if (req.newPassword !== req.confirmPassword) {
        return res.status(400).send({
          success: false,
          message: 'New password and confirm password do not match',
        });
      }
      const tokenHash = crypto.createHash('sha256').update(req.token).digest();
      const isValid = await this.appService.validateResetToken(tokenHash);
      if (isValid.isValid === true) {
        const users = await this.appService.getUsersFromProcedure(
          null,
          isValid.UserID,
        );
        const user = users && users.length > 0 ? users[0] : null;
        if (!user) {
          return res.status(404).send({
            success: false,
            message: 'User not found',
          });
        }
        const resetResult = await this.appService.resetPassword({
          UserID: isValid.UserID ? isValid.UserID : 0,
          userCode: user.UserCode,
          newPassword: req.newPassword,
          tokenHash: tokenHash,
          token: '',
          confirmPassword: '',
        });

        if (resetResult?.samePassword === 1) {
          return res.status(400).send({
            success: false,
            samePassword: true,
            message:
              'รหัสผ่านใหม่และรหัสผ่านเก่าไม่สามารถตรงกันได้ กรุณาเปลี่ยนรหัสผ่านใหม่',
          });
        }
        return res.status(200).send({
          success: true,
          message: 'Password reset successfully',
        });
      } else {
        return res.status(400).send({
          success: false,
          message: 'Invalid or expired token',
        });
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      return res.status(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  @Get('/CheckUserPermission')
  async CheckUserPermission(
    @Query() req: CheckUserPermissionDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.appService.CheckUserPermission(req);
      res.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      res.status(500).send({
        success: false,
        message: 'Error fetching users with roles',
      });
    }
  }

  @Get('/GetUserWithRoles')
  async getUserWithRoles(
    @Query() req: GetUserWithRolesDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.appService.getUserWithRoles(req);
      res.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      res.status(500).send({
        success: false,
        message: 'Error fetching users with roles',
      });
    }
  }

  @Get('/getsUserForAssetsControl')
  async getsUserForAssetsControl(@Res() res: Response) {
    try {
      const users = await this.appService.getsUserForAssetsControl();
      res.status(200).send({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Error fetching users for assets control:', error);
      res.status(500).send({
        success: false,
        message: 'Error fetching users for assets control',
      });
    }
  }
}
