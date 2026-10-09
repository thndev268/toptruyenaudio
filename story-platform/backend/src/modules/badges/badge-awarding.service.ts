import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';

@Injectable()
export class BadgeAwardingService {
  private readonly logger = new Logger(BadgeAwardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run on the first day of every month at 00:00 Vietnam time (UTC+7)
  @Cron('0 0 1 * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async checkAndAwardBadges() {
    const startTime = Date.now();
    this.logger.log('Starting monthly badge awarding check...');
    
    let topListenerResult = { success: false, error: null as any };
    let premiumResult = { success: false, error: null as any };
    
    try {
      // Check Top 1 Listener badge for previous month
      await this.checkTopListenerBadge();
      topListenerResult.success = true;
      this.logger.log('Top listener badge check completed successfully');
    } catch (error) {
      topListenerResult.error = error;
      this.logger.error('Error checking top listener badge:', error);
    }
    
    try {
      // Check Premium badge
      await this.checkPremiumBadge();
      premiumResult.success = true;
      this.logger.log('Premium badge check completed successfully');
    } catch (error) {
      premiumResult.error = error;
      this.logger.error('Error checking premium badge:', error);
    }
    
    const duration = Date.now() - startTime;
    this.logger.log(`Monthly badge awarding check completed in ${duration}ms. Top Listener: ${topListenerResult.success ? 'SUCCESS' : 'FAILED'}, Premium: ${premiumResult.success ? 'SUCCESS' : 'FAILED'}`);
  }

  /**
   * Check and award badge for top 1 listener of previous month
   * Badge: "Người nghe tích cực nhất" (TOP_LISTENER)
   */
  private async checkTopListenerBadge() {
    try {
      // Calculate previous month date range
      const now = new Date();
      const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Award period in YYYY-MM format (e.g., "2026-08")
      const awardPeriod = `${firstDayOfPreviousMonth.getFullYear()}-${String(firstDayOfPreviousMonth.getMonth() + 1).padStart(2, '0')}`;

      this.logger.log(`Checking top listener for period: ${awardPeriod} (${firstDayOfPreviousMonth.toISOString()} to ${firstDayOfCurrentMonth.toISOString()})`);

      // Get top 1 listener by total listening time in the previous month
      // Use COALESCE to handle NULL durationSeconds
      const topListener = await this.prisma.$queryRaw`
        SELECT 
          profileId,
          COALESCE(SUM(durationSeconds), 0) as totalDuration
        FROM listening_sessions
        WHERE createdAt >= ${firstDayOfPreviousMonth} AND createdAt < ${firstDayOfCurrentMonth}
          AND profileId IS NOT NULL
        GROUP BY profileId
        HAVING COALESCE(SUM(durationSeconds), 0) > 0
        ORDER BY totalDuration DESC
        LIMIT 1
      ` as any[];

      if (topListener.length > 0) {
        const topListenerData = topListener[0];
        const userId = topListenerData.profileId;
        const totalDuration = topListenerData.totalDuration;
        
        if (!userId) {
          this.logger.warn('Top listener has null profileId, skipping');
          return;
        }
        
        // Verify user exists
        const user = await this.prisma.profile.findUnique({ where: { id: userId } });
        if (!user) {
          this.logger.warn(`User ${userId} not found, skipping badge award`);
          return;
        }
        
        // Get the badge for top listener
        const badge = await this.prisma.honoraryTitle.findFirst({
          where: {
            code: 'TOP_LISTENER',
            isActive: true,
          },
        });

        if (!badge) {
          this.logger.warn('Top listener badge not found');
          return;
        }

        // Check if user already has this badge for this award period
        const existingAssignment = await this.prisma.userTitle.findFirst({
          where: {
            profileId: userId,
            titleId: badge.id,
            awardPeriod: awardPeriod,
          },
        });

        if (existingAssignment) {
          this.logger.log(`User ${userId} already has top listener badge for period ${awardPeriod}, skipping`);
          return;
        }

        // Calculate badge expiration (30 days from now)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        // Format total duration for notification
        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        const durationText = hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;

        // Award badge with period and expiration
        await this.awardBadgeWithPeriod(userId, badge.id, 'SYSTEM', awardPeriod, `Top 1 listener tháng ${now.getMonth() + 1} với ${durationText}`, expirationDate);
        this.logger.log(`Awarded top listener badge to user ${userId} for period ${awardPeriod}, expires ${expirationDate.toISOString()}`);
      } else {
        this.logger.log('No listening sessions found for previous month');
      }

      this.logger.log('New month started, listening competition reset');
    } catch (error) {
      this.logger.error('Error checking top listener badge:', error);
      throw error;
    }
  }

  /**
   * Check and award badge for premium users
   * Badge: "Thành viên Premium" (PREMIUM_MEMBER)
   */
  private async checkPremiumBadge() {
    try {
      // Get users with active premium subscription
      const premiumUsers = await this.prisma.userSubscription.findMany({
        where: {
          status: 'ACTIVE',
          endAt: {
            gte: new Date(),
          },
        },
        include: {
          profile: true,
        },
      });

      this.logger.log(`Found ${premiumUsers.length} active premium users`);

      // Get the premium badge
      const badge = await this.prisma.honoraryTitle.findFirst({
        where: {
          code: 'PREMIUM_MEMBER',
          isActive: true,
        },
      });

      if (!badge) {
        this.logger.warn('Premium badge not found');
        return;
      }

      let awardedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const subscription of premiumUsers) {
        const userId = subscription.profileId;

        if (!userId) {
          this.logger.warn('Subscription has null profileId, skipping');
          skippedCount++;
          continue;
        }

        try {
          // Check if user already has this badge (only active badges)
          const existingAssignment = await this.prisma.userTitle.findFirst({
            where: {
              profileId: userId,
              titleId: badge.id,
              revokedAt: null,
            },
          });

          if (existingAssignment) {
            skippedCount++;
            continue; // User already has the badge
          }

          // Award badge
          await this.awardBadge(userId, badge.id, 'SYSTEM', 'Premium membership');
          awardedCount++;
          this.logger.log(`Awarded premium badge to user ${userId}`);
        } catch (error) {
          errorCount++;
          this.logger.error(`Error awarding premium badge to user ${userId}:`, error);
        }
      }

      this.logger.log(`Premium badge check completed: ${awardedCount} awarded, ${skippedCount} skipped, ${errorCount} errors`);
    } catch (error) {
      this.logger.error('Error checking premium badge:', error);
      throw error;
    }
  }

  /**
   * Award badge to user with notification
   */
  private async awardBadge(
    userId: string,
    badgeId: string,
    assignedBy: string,
    reason: string,
  ) {
    try {
      // Get badge details
      const badge = await this.prisma.honoraryTitle.findUnique({
        where: { id: badgeId },
      });

      if (!badge) {
        throw new Error('Badge not found');
      }

      // Use transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // Check existing badge assignment
        const existing = await tx.userTitle.findFirst({
          where: {
            profileId: userId,
            titleId: badgeId,
            awardPeriod: null,
          },
        });

        // Assign badge to user (no period, no expiration for permanent badges)
        if (existing) {
          await tx.userTitle.update({
            where: { id: existing.id },
            data: {
              assignedAt: new Date(),
              revokedAt: null, // Clear revocation if was revoked
              expirationAt: null, // No expiration for permanent badges
            },
          });
        } else {
          await tx.userTitle.create({
            data: {
              profileId: userId,
              titleId: badgeId,
              assignedBy,
              awardPeriod: null,
            },
          });
        }

        // Check if notification already exists for this badge award
        const existingNotification = await tx.notification.findFirst({
          where: {
            targetUserId: userId,
            badgeId: badgeId,
            badgeClaimed: false,
            type: 'BADGE_AWARD',
          },
        });

        if (existingNotification) {
          this.logger.log(`Notification already exists for badge ${badge.name} to user ${userId}, skipping`);
          return;
        }

        // Create notification with badge
        const notification = await tx.notification.create({
          data: {
            title: 'Chúc mừng! Bạn nhận được danh hiệu mới',
            content: `Bạn đã đạt được danh hiệu "${badge.name}". ${reason}. Nhấn để nhận danh hiệu và hiển thị trong hồ sơ cá nhân.`,
            type: 'BADGE_AWARD',
            targetAudience: 'SPECIFIC_USER',
            targetUserId: userId,
            badgeId: badgeId,
            badgeClaimed: false,
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        // Create user notification record
        await tx.userNotification.create({
          data: {
            notificationId: notification.id,
            userId: userId,
            isRead: false,
          },
        });
      });

      this.logger.log(`Badge ${badge.name} awarded to user ${userId}`);
    } catch (error) {
      this.logger.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Award badge to user with period and expiration date
   * Used for monthly badges like TOP_LISTENER
   */
  private async awardBadgeWithPeriod(
    userId: string,
    badgeId: string,
    assignedBy: string,
    awardPeriod: string,
    reason: string,
    expirationDate: Date,
  ) {
    try {
      // Get badge details
      const badge = await this.prisma.honoraryTitle.findUnique({
        where: { id: badgeId },
      });

      if (!badge) {
        throw new Error('Badge not found');
      }

      // Use transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // Check existing badge assignment for this period
        const existing = await tx.userTitle.findFirst({
          where: {
            profileId: userId,
            titleId: badgeId,
            awardPeriod: awardPeriod,
          },
        });

        // Assign badge to user with period and expiration
        if (existing) {
          await tx.userTitle.update({
            where: { id: existing.id },
            data: {
              assignedAt: new Date(),
              expirationAt: expirationDate,
            },
          });
          this.logger.log(`Updated existing badge ${badge.name} for user ${userId} period ${awardPeriod}`);
        } else {
          try {
            await tx.userTitle.create({
              data: {
                profileId: userId,
                titleId: badgeId,
                assignedBy,
                awardPeriod: awardPeriod,
                expirationAt: expirationDate,
              },
            });
            this.logger.log(`Created new badge ${badge.name} for user ${userId} period ${awardPeriod}`);
          } catch (createError: any) {
            // Handle unique constraint violation (race condition from multiple cron instances)
            if (createError.code === 'P2002') {
              this.logger.warn(`Badge ${badge.name} for user ${userId} period ${awardPeriod} already created by another instance, skipping`);
              return; // Exit transaction gracefully
            }
            throw createError; // Re-throw other errors
          }
        }

        // Check if notification already exists for this badge award and period
        const idempotencyKey = `badge_${badge.code}_${userId}_${awardPeriod}`;
        const existingNotification = await tx.notification.findFirst({
          where: {
            targetUserId: userId,
            badgeId: badgeId,
            type: 'BADGE_AWARD',
          },
        });

        if (existingNotification) {
          this.logger.log(`Notification already exists for badge ${badge.name} to user ${userId} period ${awardPeriod}, skipping`);
          return;
        }

        // Create notification with badge and idempotency key
        try {
          const notification = await tx.notification.create({
            data: {
              title: '🏆 Chúc mừng! Bạn nhận được danh hiệu mới',
              content: `Bạn đã đạt được danh hiệu "${badge.name}". ${reason}. Hạn sử dụng: ${expirationDate.toLocaleDateString('vi-VN')}. Nhấn để nhận danh hiệu và hiển thị trong hồ sơ cá nhân.`,
              type: 'BADGE_AWARD',
              targetAudience: 'SPECIFIC_USER',
              targetUserId: userId,
              badgeId: badgeId,
              badgeClaimed: false,
              idempotencyKey: idempotencyKey,
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          // Create user notification record
          await tx.userNotification.create({
            data: {
              notificationId: notification.id,
              userId: userId,
              isRead: false,
            },
          });
        } catch (createError: any) {
          // Handle unique constraint violation (race condition from multiple cron instances)
          if (createError.code === 'P2002') {
            this.logger.warn(`Notification for badge ${badge.name} to user ${userId} period ${awardPeriod} already created by another instance, skipping`);
            return; // Exit transaction gracefully
          }
          throw createError; // Re-throw other errors
        }
      });

      this.logger.log(`Badge ${badge.name} awarded to user ${userId} for period ${awardPeriod}, expires ${expirationDate.toISOString()}`);
    } catch (error) {
      this.logger.error('Error awarding badge with period:', error);
      throw error;
    }
  }

  /**
   * Award badge to user with expiration date (legacy method for non-periodic badges)
   */
  private async awardBadgeWithExpiration(
    userId: string,
    badgeId: string,
    assignedBy: string,
    reason: string,
    expirationDate: Date,
  ) {
    try {
      // Get badge details
      const badge = await this.prisma.honoraryTitle.findUnique({
        where: { id: badgeId },
      });

      if (!badge) {
        throw new Error('Badge not found');
      }

      // Use transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // Check existing badge assignment (no period)
        const existing = await tx.userTitle.findFirst({
          where: {
            profileId: userId,
            titleId: badgeId,
            awardPeriod: null,
          },
        });

        // Assign badge to user with expiration (no period)
        if (existing) {
          await tx.userTitle.update({
            where: { id: existing.id },
            data: {
              assignedAt: new Date(),
              expirationAt: expirationDate,
            },
          });
        } else {
          await tx.userTitle.create({
            data: {
              profileId: userId,
              titleId: badgeId,
              assignedBy,
              awardPeriod: null,
              expirationAt: expirationDate,
            },
          });
        }

        // Check if notification already exists for this badge award
        const existingNotification = await tx.notification.findFirst({
          where: {
            targetUserId: userId,
            badgeId: badgeId,
            badgeClaimed: false,
            type: 'BADGE_AWARD',
          },
        });

        if (existingNotification) {
          this.logger.log(`Notification already exists for badge ${badge.name} to user ${userId}, skipping`);
          return;
        }

        // Create notification with badge
        const notification = await tx.notification.create({
          data: {
            title: 'Chúc mừng! Bạn nhận được danh hiệu mới',
            content: `Bạn đã đạt được danh hiệu "${badge.name}". ${reason}. Hạn sử dụng: ${expirationDate.toLocaleDateString('vi-VN')}. Nhấn để nhận danh hiệu và hiển thị trong hồ sơ cá nhân.`,
            type: 'BADGE_AWARD',
            targetAudience: 'SPECIFIC_USER',
            targetUserId: userId,
            badgeId: badgeId,
            badgeClaimed: false,
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        // Create user notification record
        await tx.userNotification.create({
          data: {
            notificationId: notification.id,
            userId: userId,
            isRead: false,
          },
        });
      });

      this.logger.log(`Badge ${badge.name} awarded to user ${userId} with expiration ${expirationDate.toISOString()}`);
    } catch (error) {
      this.logger.error('Error awarding badge with expiration:', error);
      throw error;
    }
  }

  /**
   * Manually trigger badge check (for testing or manual trigger)
   */
  async triggerBadgeCheck() {
    await this.checkAndAwardBadges();
  }

  /**
   * Award badge to specific user manually
   */
  async awardBadgeToUser(
    userId: string,
    badgeCode: string,
    reason: string,
  ) {
    // Validate user exists
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const badge = await this.prisma.honoraryTitle.findFirst({
      where: {
        code: badgeCode,
        isActive: true,
      },
    });

    if (!badge) {
      throw new Error(`Badge with code ${badgeCode} not found`);
    }

    await this.awardBadge(userId, badge.id, 'ADMIN', reason);
    return {
      success: true,
      message: `Badge ${badge.name} awarded to user ${userId}`,
    };
  }
}
