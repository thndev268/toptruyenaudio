import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function checkUserIp() {
  const email = process.env.USER_EMAIL || process.argv.find((arg) => arg.startsWith('--email='))?.split('=')[1];

  if (!email) {
    console.error('Lỗi: Bắt buộc phải cung cấp USER_EMAIL qua biến môi trường hoặc tham số CLI (--email=...).');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const prisma = app.get(PrismaService);
    
    const profile = await prisma.profile.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        displayName: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!profile) {
      console.error(`[Lỗi] Không tìm thấy profile với email: ${email}`);
      process.exit(1);
    }

    console.log(`[Profile Info] Email: ${email}`);
    console.log(`[Profile Info] ID: ${profile.id}`);
    console.log(`[Profile Info] Display Name: ${profile.displayName}`);
    console.log(`[Profile Info] Last Login At: ${profile.lastLoginAt?.toISOString() || 'N/A'}`);
    console.log(`[Profile Info] Last Login IP: ${profile.lastLoginIp || 'NULL (chưa ghi nhận)'}`);
    console.log(`[Profile Info] Created At: ${profile.createdAt?.toISOString()}`);
    console.log(`[Profile Info] Updated At: ${profile.updatedAt?.toISOString()}`);
    
    if (profile.lastLoginIp) {
      console.log(`\n[✅ SUCCESS] IP đã được ghi nhận: ${profile.lastLoginIp}`);
    } else {
      console.log(`\n[❌ FAILED] IP chưa được ghi nhận`);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error(`[Thất Bại] ${error.message || error}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

checkUserIp();
