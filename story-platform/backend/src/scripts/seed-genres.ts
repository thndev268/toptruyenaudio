import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function runSeed() {
  console.log('[Seed Genres] Đang khởi tạo thể loại...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const prisma = app.get(PrismaService);

    const genres = [
      { name: 'Tiên Hiệp', slug: 'tien-hiep', description: 'Thể loại tu tiên, phép thuật', iconName: 'Sparkles' },
      { name: 'Kiếm Hiệp', slug: 'kiem-hiep', description: 'Thể loại võ thuật, giang hồ', iconName: 'Swords' },
      { name: 'Ngôn Tình', slug: 'ngon-tinh', description: 'Thể loại tình cảm lãng mạn', iconName: 'Heart' },
      { name: 'Đô Thị', slug: 'do-thi', description: 'Thể loại cuộc sống đô thị hiện đại', iconName: 'Building2' },
      { name: 'Kinh Dị', slug: 'kinh-di', description: 'Thể loại ma quái, kinh dị', iconName: 'Ghost' },
      { name: 'Lịch Sử', slug: 'lich-su', description: 'Thể loại lịch sử, cổ trang', iconName: 'BookOpen' },
      { name: 'Phiêu Lưu', slug: 'phieu-luu', description: 'Thể loại phiêu lưu mạo hiểm', iconName: 'Compass' },
      { name: 'Hài Hước', slug: 'hai-huoc', description: 'Thể loại hài hước giải trí', iconName: 'Radio' },
    ];

    for (const g of genres) {
      await prisma.genre.upsert({
        where: { slug: g.slug },
        update: {},
        create: g,
      });
    }

    console.log('[Seed Genres] Đã nạp thành công thể loại!');
    process.exit(0);
  } catch (error: any) {
    console.error('[Seed Genres Thất Bại]', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeed();
