import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // Upsert basic genres
  const genres = [
    { name: 'Tiên Hiệp', slug: 'tien-hiep', description: 'Thể loại tu tiên, phép thuật' },
    { name: 'Kiếm Hiệp', slug: 'kiem-hiep', description: 'Thể loại võ thuật, giang hồ' },
    { name: 'Ngôn Tình', slug: 'ngon-tinh', description: 'Thể loại tình cảm lãng mạn' }
  ];

  for (const g of genres) {
    await prisma.genre.upsert({
      where: { slug: g.slug },
      update: {},
      create: {
        name: g.name,
        slug: g.slug,
        description: g.description,
      },
    });
  }

  // Upsert a test story
  const story = await prisma.story.upsert({
    where: { slug: 'phan-nhan-tu-tien' },
    update: {},
    create: {
      title: 'Phàm Nhân Tu Tiên',
      slug: 'phan-nhan-tu-tien',
      authorName: 'Vong Ngữ',
      narratorName: 'MC Cường',
      summary: 'Một thiếu niên bình thường xông pha giang hồ tu tiên...',
      accessLevel: 'FREE',
    },
  });

  // Upsert a test chapter
  await prisma.chapter.create({
    data: {
      storyId: story.id,
      number: 1,
      title: 'Chương 1: Khởi đầu',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      durationSeconds: 300,
    },
  }).catch((e) => {
    // Ignore if already exists (no unique constraint on chapter number in this basic schema)
    console.log('Chapter might already exist, ignoring.');
  });

  // Seed subscription plans
  const subscriptionPlans = [
    {
      id: 'PREMIUM_MONTHLY',
      code: 'PREMIUM_MONTHLY',
      name: 'Premium Tháng',
      durationDays: 30,
      price: 59000,
      features: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
    },
    {
      id: 'PREMIUM_QUARTERLY',
      code: 'PREMIUM_QUARTERLY',
      name: 'Premium 3 Tháng',
      durationDays: 90,
      price: 150000,
      features: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
    },
    {
      id: 'PREMIUM_SEMIANNUAL',
      code: 'PREMIUM_SEMIANNUAL',
      name: 'Premium 6 Tháng',
      durationDays: 180,
      price: 270000,
      features: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
    },
    {
      id: 'PREMIUM_ANNUAL',
      code: 'PREMIUM_ANNUAL',
      name: 'Premium 12 Tháng',
      durationDays: 365,
      price: 480000,
      features: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }

  // Seed honorary titles/badges
  const honoraryTitles = [
    {
      code: 'VIP_MEMBER',
      name: 'Thành viên VIP',
      description: 'Dành cho thành viên Premium tích cực',
      iconUrl: '/badges/vip-member.png',
      effects: { commentHighlight: true, profileBorder: 'gold' },
    },
    {
      code: 'TOP_LISTENER',
      name: 'Người nghe hàng đầu',
      description: 'Người dùng có thời gian nghe nhiều nhất',
      iconUrl: '/badges/top-listener.png',
      effects: { commentHighlight: true, priorityQueue: true },
    },
    {
      code: 'EARLY_SUPPORTER',
      name: 'Người ủng hộ sớm',
      description: 'Thành viên tham gia từ giai đoạn đầu',
      iconUrl: '/badges/early-supporter.png',
      effects: { badge: 'early-adopter' },
    },
    {
      code: 'CONTENT_CREATOR',
      name: 'Tác giả nổi bật',
      description: 'Dành cho các creator có nội dung chất lượng',
      iconUrl: '/badges/content-creator.png',
      effects: { creatorBadge: true, featuredPlacement: true },
    },
    {
      code: 'COMMUNITY_HELPER',
      name: 'Người đóng góp cộng đồng',
      description: 'Người dùng tích cực hỗ trợ cộng đồng',
      iconUrl: '/badges/community-helper.png',
      effects: { specialColor: 'blue', moderatorPrivileges: false },
    },
    {
      code: 'BUG_HUNTER',
      name: 'Săn lỗi',
      description: 'Người dùng phát hiện và báo cáo lỗi hệ thống',
      iconUrl: '/badges/bug-hunter.png',
      effects: { badge: 'bug-hunter' },
    },
  ];

  for (const title of honoraryTitles) {
    await prisma.honoraryTitle.upsert({
      where: { code: title.code },
      update: {},
      create: title,
    });
  }

  console.log('Seed finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
