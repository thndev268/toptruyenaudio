import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function setUserIp() {
  const email = process.env.USER_EMAIL || process.argv.find((arg) => arg.startsWith('--email='))?.split('=')[1];
  const ip = process.env.USER_IP || process.argv.find((arg) => arg.startsWith('--ip='))?.split('=')[1];

  if (!email) {
    console.error('Lỗi: Bắt buộc phải cung cấp USER_EMAIL qua biến môi trường hoặc tham số CLI (--email=...).');
    process.exit(1);
  }

  if (!ip) {
    console.error('Lỗi: Bắt buộc phải cung cấp USER_IP qua biến môi trường hoặc tham số CLI (--ip=...).');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const prisma = app.get(PrismaService);
    
    const profile = await prisma.profile.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!profile) {
      console.error(`[Lỗi] Không tìm thấy profile với email: ${email}`);
      process.exit(1);
    }

    const updated = await prisma.profile.update({
      where: { email: email.toLowerCase() },
      data: { lastLoginIp: ip }
    });

    console.log(`[Thành Công] Đã cập nhật lastLoginIp thành ${ip} cho email: ${email}`);
    console.log(`Profile ID: ${updated.id}`);
    console.log(`IP: ${updated.lastLoginIp}`);
    process.exit(0);
  } catch (error: any) {
    console.error(`[Thất Bại] ${error.message || error}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

setUserIp();
