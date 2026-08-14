import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';

async function runBootstrap() {
  const email = process.env.ADMIN_EMAIL || process.argv.find((arg) => arg.startsWith('--email='))?.split('=')[1];
  const password = process.env.ADMIN_PASSWORD || process.argv.find((arg) => arg.startsWith('--password='))?.split('=')[1];
  const displayName = process.env.ADMIN_DISPLAY_NAME || 'Chủ Sở Hữu (Owner Admin)';

  if (!email || !password) {
    console.error('Lỗi khởi tạo: Bắt buộc phải cung cấp ADMIN_EMAIL và ADMIN_PASSWORD qua biến môi trường hoặc tham số CLI (--email=... --password=...).');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const authService = app.get(AuthService);
    await authService.bootstrapOwnerAdmin(email, password, displayName);
    console.log(`[Bootstrap Thành Công] Đã khởi tạo tài khoản quản trị OWNER_ADMIN cho email: ${email}`);
    process.exit(0);
  } catch (error: any) {
    console.error(`[Bootstrap Thất Bại] ${error.message || error}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runBootstrap();
