import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  private supabase;

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super();
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async validate(req: Request): Promise<any> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    
    // Validate with Supabase
    const { data, error } = await this.supabase.auth.getUser(token);
    
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid Supabase token');
    }

    // Now match with our local MongoDB user
    let user = await this.userModel.findOne({ email: data.user.email }).exec();
    
    if (!user) {
      // Sync from Supabase to MongoDB if user exists in Supabase but not MongoDB yet
      user = new this.userModel({
        email: data.user.email,
        emailNormalized: data.user.email?.toLowerCase(),
        displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        role: 'USER',
        status: 'ACTIVE',
        membershipTier: 'FREE',
      });
      await user.save();
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      id: user._id.toString(),
      supabaseId: data.user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      membershipTier: user.membershipTier,
    };
  }
}
