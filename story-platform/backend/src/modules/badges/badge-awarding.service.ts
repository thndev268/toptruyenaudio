import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BadgeAwardingService {
  private readonly logger = new Logger(BadgeAwardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run on the first day of every month at 00:00
  @Cron('0 0 1 * *')
  async checkAndAwardBadges() {
    this.logger.log('Starting monthly badge awarding check...');
    
    try {
      // Check Top 1 Listener badge for previous month
      await this.checkTopListenerBadge();
      
      // Check Premium badge
      await this.checkPremiumBadge();
      
      this.logger.log('Monthly badge awarding check completed');
    } catch (error) {
      this.logger.error('Error during monthly badge awarding check:', error);
    }
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

      this.logger.log(`Checking top listener for period: ${firstDayOfPreviousMonth.toISOString()} to ${firstDayOfCurrentMonth.toISOString()}`);

      // Get top 1 listener by total listening time in the previous month
      const topListener = await this.prisma.$queryRaw`
        SELECT 
          profileId,
          SUM(durationSeconds) as totalDuration
        FROM listening_sessions
        WHERE createdAt >= ${firstDayOfPreviousMonth} AND createdAt < ${firstDayOfCurrentMonth}
        GROUP BY profileId
        ORDER BY totalDuration DESC
        LIMIT 1
      ` as any[];

      if (topListener.length > 0) {
        const topListenerData = topListener[0];
        const userId = topListenerData.profileId;
        
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

        // Calculate badge expiration (30 days from now)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        // Award badge with expiration
        await this.awardBadgeWithExpiration(userId, badge.id, 'SYSTEM', `Top 1 listener tháng ${now.getMonth()}`, expirationDate);
        this.logger.log(`Awarded top listener badge to user ${userId} with expiration ${expirationDate.toISOString()}`);
      } else {
        this.logger.log('No listening sessions found for previous month');
      }

      // Reset listening sessions for the new month (optional - keep history but mark as new month)
      // This is just a marker, actual data is kept for analytics
      this.logger.log('New month started, listening competition reset');
    } catch (error) {
      this.logger.error('Error checking top listener badge:', error);
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

      for (const subscription of premiumUsers) {
        const userId = subscription.profileId;

        // Check if user already has this badge
        const existingAssignment = await this.prisma.userTitle.findFirst({
          where: {
            profileId: userId,
            titleId: badge.id,
          },
        });

        if (existingAssignment) {
          continue; // User already has the badge
        }

        // Award badge
        await this.awardBadge(userId, badge.id, 'SYSTEM', 'Premium membership');
        this.logger.log(`Awarded premium badge to user ${userId}`);
      }
    } catch (error) {
      this.logger.error('Error checking premium badge:', error);
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

      // Assign badge to user
      await this.prisma.userTitle.upsert({
        where: {
          profileId_titleId: {
            profileId: userId,
            titleId: badgeId,
          },
        },
        update: {
          assignedAt: new Date(),
        },
        create: {
          profileId: userId,
          titleId: badgeId,
          assignedBy,
        },
      });

      // Create notification with badge
      const notification = await this.prisma.notification.create({
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
      await this.prisma.userNotification.create({
        data: {
          notificationId: notification.id,
          userId: userId,
          isRead: false,
        },
      });

      this.logger.log(`Badge ${badge.name} awarded to user ${userId} with notification ${notification.id}`);
    } catch (error) {
      this.logger.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Award badge to user with expiration date
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

      // Assign badge to user with expiration
      await this.prisma.userTitle.upsert({
        where: {
          profileId_titleId: {
            profileId: userId,
            titleId: badgeId,
          },
        },
        update: {
          assignedAt: new Date(),
          revokedAt: expirationDate,
        },
        create: {
          profileId: userId,
          titleId: badgeId,
          assignedBy,
          revokedAt: expirationDate,
        },
      });

      // Create notification with badge
      const notification = await this.prisma.notification.create({
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
      await this.prisma.userNotification.create({
        data: {
          notificationId: notification.id,
          userId: userId,
          isRead: false,
        },
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
