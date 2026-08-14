import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function setAdminRole() {
  const email = process.env.ADMIN_EMAIL || process.argv.find((arg) => arg.startsWith('--email='))?.split('=')[1];

  if (!email) {
    console.error('Lỗi: Bắt buộc phải cung cấp ADMIN_EMAIL qua biến môi trường hoặc tham số CLI (--email=...).');
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

    if (profile.role === 'OWNER_ADMIN') {
      console.log(`[Info] Profile ${email} đã có role OWNER_ADMIN`);
      process.exit(0);
    }

    const updated = await prisma.profile.update({
      where: { email: email.toLowerCase() },
      data: { role: 'OWNER_ADMIN' }
    });

    console.log(`[Thành Công] Đã cập nhật role thành OWNER_ADMIN cho email: ${email}`);
    console.log(`Profile ID: ${updated.id}`);
    process.exit(0);
  } catch (error: any) {
    console.error(`[Thất Bại] ${error.message || error}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

setAdminRole();
