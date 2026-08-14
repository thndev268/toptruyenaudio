import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function seedSampleData() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const prisma = app.get(PrismaService);
    
    console.log('Đang kiểm tra kết nối database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Kết nối database thành công');
    
    // Check existing profiles
    const existingProfiles = await prisma.profile.findMany();
    console.log(`\nSố lượng profiles hiện tại: ${existingProfiles.length}`);
    
    if (existingProfiles.length > 0) {
      console.log('\nDanh sách profiles hiện có:');
      existingProfiles.forEach((p, i) => {
        console.log(`${i + 1}. ${p.email} - Role: ${p.role} - Status: ${p.status}`);
      });
    }
    
    // Create sample admin user if not exists
    const adminEmail = 'admin@toptruyenaudio.com';
    const existingAdmin = await prisma.profile.findUnique({
      where: { email: adminEmail }
    });
    
    if (!existingAdmin) {
      console.log(`\nĐang tạo admin user mẫu: ${adminEmail}`);
      const admin = await prisma.profile.create({
        data: {
          id: 'admin-sample-id-001',
          email: adminEmail,
          emailNormalized: adminEmail.toLowerCase(),
          displayName: 'Admin Mẫu',
          role: 'OWNER_ADMIN',
          status: 'ACTIVE',
          membershipTier: 'PREMIUM',
        }
      });
      console.log(`✅ Đã tạo admin user: ${admin.email} với role OWNER_ADMIN`);
    } else {
      console.log(`\n✅ Admin user đã tồn tại: ${existingAdmin.email} (Role: ${existingAdmin.role})`);
      
      // Update to OWNER_ADMIN if needed
      if (existingAdmin.role !== 'OWNER_ADMIN') {
        await prisma.profile.update({
          where: { email: adminEmail },
          data: { role: 'OWNER_ADMIN' }
        });
        console.log(`✅ Đã cập nhật role thành OWNER_ADMIN`);
      }
    }
    
    // Create sample regular user
    const userEmail = 'user@example.com';
    const existingUser = await prisma.profile.findUnique({
      where: { email: userEmail }
    });
    
    if (!existingUser) {
      console.log(`\nĐang tạo user mẫu: ${userEmail}`);
      const user = await prisma.profile.create({
        data: {
          id: 'user-sample-id-001',
          email: userEmail,
          emailNormalized: userEmail.toLowerCase(),
          displayName: 'User Mẫu',
          role: 'USER',
          status: 'ACTIVE',
          membershipTier: 'FREE',
        }
      });
      console.log(`✅ Đã tạo user mẫu: ${user.email} với role USER`);
    } else {
      console.log(`\n✅ User mẫu đã tồn tại: ${existingUser.email} (Role: ${existingUser.role})`);
    }
    
    // Create sample story
    const existingStory = await prisma.story.findFirst({
      where: { title: 'Truyện Mẫu 1' }
    });
    
    if (!existingStory) {
      console.log('\nĐang tạo truyện mẫu...');
      const story = await prisma.story.create({
        data: {
          title: 'Truyện Mẫu 1',
          slug: 'truyen-mau-1',
          authorName: 'Tác Giả Mẫu',
          narratorName: 'Người Đọc Mẫu',
          summary: 'Đây là truyện mẫu để kiểm tra hệ thống.',
          storyStatus: 'ONGOING',
          publishStatus: 'PUBLISHED',
          isVideoStory: false,
        }
      });
      console.log(`✅ Đã tạo truyện mẫu: ${story.title}`);
    } else {
      console.log(`\n✅ Truyện mẫu đã tồn tại: ${existingStory.title}`);
    }
    
    console.log('\n=== Hoàn tất seeding dữ liệu mẫu ===');
    
    process.exit(0);
  } catch (error: any) {
    console.error(`[Lỗi] ${error.message || error}`);
    console.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedSampleData();
