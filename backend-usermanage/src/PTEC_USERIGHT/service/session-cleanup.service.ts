// portal-backend/src/PTEC_USERIGHT/service/session-cleanup.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthSession } from '../domain/model/auth-session.entity';

@Injectable()
export class SessionCleanupService implements OnModuleInit {
  private readonly logger = new Logger(SessionCleanupService.name);
  private isCleanupRunning = false;

  constructor(
    @InjectRepository(AuthSession, 'auth')
    private readonly sessionRepo: Repository<AuthSession>,
  ) {}

  /**
   *  รันทันทีตอน Backend Start ล้าง Session Database หมดอายุแล้ว
   */
  async onModuleInit() {
    this.logger.log('🚀 Initializing Session Cleanup Service...');

    // รอ 5 วินาที ให้ TypeORM init เสร็จก่อน
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await this.runFullCleanup();
    this.logger.log('Session Cleanup Service initialized');
  }

  /**
   *  Cron - ทุก 10 นาที
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledCleanup() {
    if (this.isCleanupRunning) {
      this.logger.warn('Cleanup already running, skipping...');
      return;
    }

    await this.runFullCleanup();
  }

  /**
   *  Full Cleanup Method
   */
  private async runFullCleanup(): Promise<void> {
    this.isCleanupRunning = true;

    try {
      // Revoke expired sessions
      const revokedCount = await this.revokeExpiredSessions();

      // Delete old sessions (เฉพาะตอน 2:00-3:00 AM)
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 2 && hour < 3) {
        const deletedCount = await this.deleteOldSessions();
        this.logger.log(
          `Cleanup complete: ${revokedCount} revoked, ${deletedCount} deleted`,
        );
      } else {
        if (revokedCount > 0) {
          this.logger.log(`Cleanup complete: ${revokedCount} revoked`);
        } else {
          this.logger.debug('No expired sessions found');
        }
      }
    } catch (error) {
      this.logger.error('❌ Cleanup error:', error);
    } finally {
      this.isCleanupRunning = false;
    }
  }

  /**
   *  Revoke Expired Sessions
   */
  private async revokeExpiredSessions(): Promise<number> {
    try {
      const result = await this.sessionRepo
        .createQueryBuilder()
        .update(AuthSession)
        .set({ isRevoked: true })
        .where('expiresAt <= :now', { now: new Date() })
        .andWhere('isRevoked = :isRevoked', { isRevoked: false })
        .execute();

      const count = result.affected || 0;

      if (count > 0) {
        this.logger.log(`Revoked ${count} expired sessions`);
      }

      return count;
    } catch (error) {
      this.logger.error('Error revoking sessions:', error);
      return 0;
    }
  }

  /**
   *  Delete Old Sessions (เก่ากว่า 7 วัน)
   */
  private async deleteOldSessions(): Promise<number> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.sessionRepo
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :date', { date: sevenDaysAgo })
        .execute();

      const count = result.affected || 0;

      if (count > 0) {
        this.logger.log(`Deleted ${count} old sessions`);
      }

      return count;
    } catch (error) {
      this.logger.error('Error deleting sessions:', error);
      return 0;
    }
  }

  /**
   *  Manual Trigger (สำหรับ API endpoint)
   */
  async forceCleanup(): Promise<{ revoked: number; deleted: number }> {
    try {
      this.logger.log('Force cleanup triggered');

      const revokedCount = await this.revokeExpiredSessions();
      const deletedCount = await this.deleteOldSessions();

      this.logger.log(
        `Force cleanup complete: ${revokedCount} revoked, ${deletedCount} deleted`,
      );

      return {
        revoked: revokedCount,
        deleted: deletedCount,
      };
    } catch (error) {
      this.logger.error('Error in force cleanup:', error);
      throw error;
    }
  }
}
