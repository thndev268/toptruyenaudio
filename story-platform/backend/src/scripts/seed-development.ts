import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SubscriptionPlan } from '../modules/subscriptions/schemas/subscription-plan.schema';
import { FeatureFlag } from '../modules/feature-flags/schemas/feature-flag.schema';
import { User } from '../modules/users/schemas/user.schema';
import { SupportConversation } from '../modules/support/schemas/support-conversation.schema';
import { SupportMessage } from '../modules/support/schemas/support-message.schema';

async function runSeed() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SEED !== 'true') {
    console.error('[Seed Denied] Không thể chạy seed-development trong môi trường production trừ khi có biến ALLOW_DEV_SEED=true.');
    process.exit(1);
  }

  console.log('[Seed Dev] Đang khởi tạo dữ liệu mẫu cho MongoDB (Development Mode)...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const planModel = app.get<Model<SubscriptionPlan>>(getModelToken(SubscriptionPlan.name));
    const flagModel = app.get<Model<FeatureFlag>>(getModelToken(FeatureFlag.name));
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const convModel = app.get<Model<SupportConversation>>(getModelToken(SupportConversation.name));
    const msgModel = app.get<Model<SupportMessage>>(getModelToken(SupportMessage.name));

    // 1. Seed Core Subscription Plans (Idempotent upsert)
    console.log('[Seed Core] Đang seed các gói Premium...');
    const plans = [
      {
        planCode: 'PREMIUM_MONTHLY',
        name: 'Gói 1 Tháng (Linh hoạt)',
        description: 'Nghe không giới hạn trong 30 ngày, chất lượng 320kbps, không quảng cáo.',
        priceVnd: 59000,
        durationDays: 30,
        isActive: true,
      },
      {
        planCode: 'PREMIUM_QUARTERLY',
        name: 'Gói 3 Tháng (Phổ biến)',
        description: 'Tiết kiệm 10% so với mua theo tháng.',
        priceVnd: 159000,
        durationDays: 90,
        isActive: true,
      },
      {
        planCode: 'PREMIUM_SEMIANNUAL',
        name: 'Gói 6 Tháng',
        description: 'Tiết kiệm 20% so với mua theo tháng.',
        priceVnd: 299000,
        durationDays: 180,
        isActive: true,
      },
      {
        planCode: 'PREMIUM_ANNUAL',
        name: 'Gói 1 Năm (Siêu tiết kiệm 30%)',
        description: 'Truy cập đầy đủ tính năng Premium cho cả năm.',
        priceVnd: 499000,
        durationDays: 365,
        isActive: true,
      },
    ];

    for (const p of plans) {
      await planModel.updateOne(
        { planCode: p.planCode },
        { $set: p },
        { upsert: true }
      );
    }

    // 2. Seed Core Feature Flags
    console.log('[Seed Core] Đang seed các Feature Flags...');
    const flags = [
      {
        key: 'audioStreaming320Kbps',
        name: 'Phát Âm Thanh Chất Lượng Cao 320kbps',
        description: 'Cho phép thành viên Premium nghe audio bitrate cao.',
        category: 'PREMIUM',
        isEnabled: true,
        isProtected: true,
      },
      {
        key: 'creatorUploadAutoEncode',
        name: 'Tự Động Mã Hóa AAC Cho Creator',
        description: 'Tự động chuyển file MP3 thô sang chuẩn HLS.',
        category: 'CREATOR',
        isEnabled: true,
      },
      {
        key: 'guestListenLimit',
        name: 'Giới Hạn 5 Tập Cho Khách Vãng Lai',
        description: 'Yêu cầu đăng ký sau khi nghe 5 tập đầu.',
        category: 'AUDIO',
        isEnabled: true,
      },
      {
        key: 'systemMaintenanceBanner',
        name: 'Hiển Thị Banner Bảo Trì',
        description: 'Thanh thông báo bảo trì đầu trang.',
        category: 'SYSTEM',
        isEnabled: false,
      },
      {
        key: 'securityAutoBanBruteForce',
        name: 'Tự Động Khóa IP Brute Force',
        description: 'Khóa IP 24h nếu gõ sai mật khẩu nhiều lần.',
        category: 'SECURITY',
        isEnabled: true,
        isProtected: true,
      },
      {
        key: 'userReviewModeration',
        name: 'Kiểm Duyệt Bình Luận Tự Động',
        description: 'Giữ lại bình luận có từ khóa nhạy cảm.',
        category: 'SYSTEM',
        isEnabled: true,
      },
    ];

    for (const f of flags) {
      await flagModel.updateOne(
        { key: f.key },
        { $set: f },
        { upsert: true }
      );
    }

    // 3. Seed Development Users
    console.log('[Seed Dev] Đang seed các tài khoản người dùng thử nghiệm...');
    const salt = await bcrypt.genSalt(10);
    const defaultHashedPassword = await bcrypt.hash('Password123!', salt);

    const devUsers = [
      {
        email: 'free.user@toptruyenaudio.com',
        passwordHash: defaultHashedPassword,
        displayName: 'Thành Viên Miễn Phí (Free Test)',
        role: 'USER',
        accountStatus: 'ACTIVE',
        membershipTier: 'FREE',
      },
      {
        email: 'premium.user@toptruyenaudio.com',
        passwordHash: defaultHashedPassword,
        displayName: 'Thành Viên VIP Premium (VIP Test)',
        role: 'USER',
        accountStatus: 'ACTIVE',
        membershipTier: 'PREMIUM',
      },
    ];

    for (const u of devUsers) {
      const existing = await userModel.findOne({ email: u.email }).exec();
      if (!existing) {
        await userModel.create(u);
      }
    }

    // 4. Seed Support Conversations for Dev User
    console.log('[Seed Dev] Đang seed dữ liệu cuộc hội thoại hỗ trợ...');
    const freeUser = await userModel.findOne({ email: 'free.user@toptruyenaudio.com' }).exec();
    if (freeUser) {
      const existingConv = await convModel.findOne({ userId: freeUser._id }).exec();
      if (!existingConv) {
        const conv = new convModel({
          userId: freeUser._id,
          userName: freeUser.displayName,
          subject: 'Hỏi về cách nâng cấp tài khoản Premium qua VietQR',
          category: 'PREMIUM',
          status: 'WAITING_FOR_ADMIN',
          priority: 'NORMAL',
          lastMessageAt: new Date(),
          userUnreadCount: 0,
          adminUnreadCount: 1,
        });
        const savedConv = await conv.save();

        await msgModel.create({
          conversationId: savedConv._id,
          senderId: freeUser._id,
          senderRole: 'USER',
          senderName: freeUser.displayName,
          content: 'Chào Admin, cho mình hỏi thanh toán qua VietQR thì mất bao lâu tài khoản được kích hoạt Premium?',
          createdAt: new Date(),
        });
      }
    }

    console.log('[Seed Hoàn Tất] Đã nạp thành công toàn bộ dữ liệu mẫu vào MongoDB!');
    process.exit(0);
  } catch (error: any) {
    console.error('[Seed Thất Bại]', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeed();
