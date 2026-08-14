import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountStatus } from '../../common/enums';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  private supabase;

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async validate(req: Request): Promise<any> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'MISSING_TOKEN',
        message: 'Authorization header missing or invalid format.',
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate with Supabase
    const { data, error } = await this.supabase.auth.getUser(token);
    
    if (error || !data.user) {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Token không hợp lệ hoặc đã hết hạn.',
      });
    }

    let user = await this.prisma.profile.findUnique({ where: { id: data.user.id } });
    
    if (!user) {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'admin@toptruyenaudio.com';
      const isOwnerAdmin = data.user.email?.toLowerCase() === adminEmail.toLowerCase();

      // Sync from Supabase to Postgres if profile exists in Supabase but not Postgres yet
      user = await this.prisma.profile.create({
        data: {
          id: data.user.id,
          email: data.user.email || '',
          emailNormalized: data.user.email?.toLowerCase(),
          displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          role: isOwnerAdmin ? 'OWNER_ADMIN' : 'USER',
          status: AccountStatus.ACTIVE,
          membershipTier: 'FREE',
        }
      });
    } else {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'admin@toptruyenaudio.com';
      if (data.user.email?.toLowerCase() === adminEmail.toLowerCase() && user.role !== 'OWNER_ADMIN') {
        user = await this.prisma.profile.update({
          where: { id: user.id },
          data: { role: 'OWNER_ADMIN' }
        });
      }
    }

    if (user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: user.status === AccountStatus.SUSPENDED 
          ? 'Tài khoản của bạn đã bị tạm khóa.' 
          : 'Tài khoản của bạn đã bị vô hiệu hóa.',
      });
    }

    return {
      id: user.id,
      supabaseId: data.user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      membershipTier: user.membershipTier,
    };
  }
}
