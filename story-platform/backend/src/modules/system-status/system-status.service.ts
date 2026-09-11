import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../telegram/ai.service';
import { TelegramService } from '../telegram/telegram.service';

export type ServiceStatus = 'operational' | 'degraded' | 'major_outage' | 'unknown' | 'configured';

export interface ServiceHealth {
  status: ServiceStatus;
  responseTime: number | null;
}

export interface SystemStatusResponse {
  overallStatus: ServiceStatus;
  checkedAt: string;
  services: {
    website: ServiceHealth;
    api: ServiceHealth;
    database: ServiceHealth;
    storage: ServiceHealth;
    payment: ServiceHealth;
    telegram: ServiceHealth;
    ai: ServiceHealth;
  };
  statistics: {
    requestsToday: number;
    errorRate: number;
    averageResponseTime: number;
    databaseQueryTime: number;
    ai: {
      requestsToday: number;
      inputTokensToday: number;
      outputTokensToday: number;
      totalTokensToday: number;
    };
    storage: {
      usedBytes: number | null;
    };
  };
}

@Injectable()
export class SystemStatusService {
  private readonly logger = new Logger(SystemStatusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
    private readonly telegramService: TelegramService,
  ) {}

  async getSystemStatus(): Promise<SystemStatusResponse> {
    const checkedAt = new Date().toISOString();

    // Check all services in parallel
    const [
      websiteHealth,
      apiHealth,
      databaseHealth,
      storageHealth,
      paymentHealth,
      telegramHealth,
      aiHealth,
      statistics,
    ] = await Promise.all([
      this.checkWebsite(),
      this.checkApi(),
      this.checkDatabase(),
      this.checkStorage(),
      this.checkPayment(),
      this.checkTelegram(),
      this.checkAi(),
      this.getStatistics(),
    ]);

    const services = {
      website: websiteHealth,
      api: apiHealth,
      database: databaseHealth,
      storage: storageHealth,
      payment: paymentHealth,
      telegram: telegramHealth,
      ai: aiHealth,
    };

    const overallStatus = this.calculateOverallStatus(services);

    return {
      overallStatus,
      checkedAt,
      services,
      statistics,
    };
  }

  private calculateOverallStatus(services: Record<string, ServiceHealth>): ServiceStatus {
    const statuses = Object.values(services).map((s) => s.status);

    if (statuses.some((s) => s === 'major_outage')) {
      return 'major_outage';
    }

    if (statuses.some((s) => s === 'degraded')) {
      return 'degraded';
    }

    if (statuses.some((s) => s === 'unknown')) {
      return 'unknown';
    }

    return 'operational';
  }

  private async checkWebsite(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Simple check - website is considered operational if backend is running
      const responseTime = Date.now() - startTime;
      return { status: 'operational', responseTime };
    } catch (error) {
      this.logger.error('[SystemStatus] Website check failed:', error);
      return { status: 'major_outage', responseTime: null };
    }
  }

  private async checkApi(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // API is considered operational if this service is running
      const responseTime = Date.now() - startTime;
      return { status: 'operational', responseTime };
    } catch (error) {
      this.logger.error('[SystemStatus] API check failed:', error);
      return { status: 'major_outage', responseTime: null };
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Perform a lightweight query
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      if (responseTime > 1000) {
        return { status: 'degraded', responseTime };
      }

      return { status: 'operational', responseTime };
    } catch (error) {
      this.logger.error('[SystemStatus] Database check failed:', error);
      return { status: 'major_outage', responseTime: null };
    }
  }

  private async checkStorage(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Check if StorageService is configured
      // We can't upload a test file, so we just check configuration
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return { status: 'unknown', responseTime: null };
      }

      const responseTime = Date.now() - startTime;
      return { status: 'operational', responseTime };
    } catch (error) {
      this.logger.error('[SystemStatus] Storage check failed:', error);
      return { status: 'major_outage', responseTime: null };
    }
  }

  private async checkPayment(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Check if PayOS is configured
      const payOsClientId = process.env.PAYOS_CLIENT_ID;
      const payOsApiKey = process.env.PAYOS_API_KEY;
      const payOsChecksumKey = process.env.PAYOS_CHECKSUM_KEY;

      if (!payOsClientId || !payOsApiKey || !payOsChecksumKey) {
        return { status: 'configured', responseTime: null };
      }

      const responseTime = Date.now() - startTime;
      return { status: 'operational', responseTime };
    } catch (error) {
      this.logger.error('[SystemStatus] Payment check failed:', error);
      return { status: 'major_outage', responseTime: null };
    }
  }

  private async checkTelegram(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Check if Telegram bot is configured
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        return { status: 'unknown', responseTime: null };
      }

      // Try to call getMe if TelegramService supports it
      // For now, just check configuration
      const responseTime = Date.now() - startTime;
      return { status: 'operational', responseTime };
    } catch (error) {
      this.logger.error('[SystemStatus] Telegram check failed:', error);
      return { status: 'major_outage', responseTime: null };
    }
  }

  private async checkAi(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Check if AI service is configured
      const isConfigured = this.aiService.isConfigured();

      if (!isConfigured) {
        return { status: 'unknown', responseTime: null };
      }

      const responseTime = Date.now() - startTime;
      return { status: 'operational', responseTime };
    } catch (error) {
      this.logger.error('[SystemStatus] AI check failed:', error);
      return { status: 'major_outage', responseTime: null };
    }
  }

  private async getStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get AI usage for today
    const aiUsageRecords = await this.prisma.aiUsage.findMany({
      where: {
        date: today,
      },
    });

    const aiStats = aiUsageRecords.reduce(
      (acc, record) => ({
        requestsToday: acc.requestsToday + record.requestCount,
        inputTokensToday: acc.inputTokensToday + record.inputTokens,
        outputTokensToday: acc.outputTokensToday + record.outputTokens,
        totalTokensToday: acc.totalTokensToday + record.totalTokens,
      }),
      {
        requestsToday: 0,
        inputTokensToday: 0,
        outputTokensToday: 0,
        totalTokensToday: 0,
      },
    );

    // For now, we don't have real-time request tracking
    // These will be 0 until we implement request logging
    return {
      requestsToday: 0,
      errorRate: 0,
      averageResponseTime: 0,
      databaseQueryTime: 0,
      ai: aiStats,
      storage: {
        usedBytes: null, // Supabase doesn't provide storage usage via API
      },
    };
  }
}
