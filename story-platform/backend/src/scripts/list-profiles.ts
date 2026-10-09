import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function listProfiles() {
  const databaseUrl = process.env.DATABASE_URL || process.argv.find((arg) => arg.startsWith('--database-url='))?.split('=')[1];
  
  if (databaseUrl) {
    process.env.DATABASE_URL = databaseUrl;
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const prisma = app.get(PrismaService);
    
    const profiles = await prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`\n=== Danh sách Profiles trong Database ===`);
    console.log(`Tổng số profiles: ${profiles.length}\n`);

    if (profiles.length === 0) {
      console.log('Không có profile nào trong database.');
    } else {
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ID: ${profile.id}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Display Name: ${profile.displayName}`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Status: ${profile.status}`);
        console.log(`   Membership Tier: ${profile.membershipTier}`);
        console.log(`   Created At: ${profile.createdAt.toISOString()}`);
        console.log(`   Last Login: ${profile.lastLoginAt?.toISOString() || 'Never'}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error(`[Lỗi] ${error.message || error}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

listProfiles();
