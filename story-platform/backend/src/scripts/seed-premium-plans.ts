import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Thiếu biến môi trường DATABASE_URL');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedPremiumPlans() {
  console.log('🌱 Seeding Premium Plans...');

  const plans = [
    {
      id: 'PREMIUM_MONTHLY',
      code: 'PREMIUM_MONTHLY',
      name: 'Premium 1 Tháng',
      price: 59000,
      durationDays: 30,
      benefits: [
        'Nghe không giới hạn truyện Premium',
        'Chất lượng âm thanh cao nhất',
        'Tải offline để nghe khi không có mạng',
        'Không quảng cáo',
        'Hỗ trợ ưu tiên',
      ],
      isActive: true,
    },
    {
      id: 'PREMIUM_QUARTERLY',
      code: 'PREMIUM_QUARTERLY',
      name: 'Premium 3 Tháng',
      price: 150000,
      durationDays: 90,
      benefits: [
        'Nghe không giới hạn truyện Premium',
        'Chất lượng âm thanh cao nhất',
        'Tải offline để nghe khi không có mạng',
        'Không quảng cáo',
        'Hỗ trợ ưu tiên',
        'Tiết kiệm 12% so với mua 1 tháng',
      ],
      isActive: true,
    },
    {
      id: 'PREMIUM_SEMIANNUAL',
      code: 'PREMIUM_SEMIANNUAL',
      name: 'Premium 6 Tháng',
      price: 270000,
      durationDays: 180,
      benefits: [
        'Nghe không giới hạn truyện Premium',
        'Chất lượng âm thanh cao nhất',
        'Tải offline không giới hạn',
        'Không quảng cáo',
        'Hỗ trợ ưu tiên 24/7',
        'Tiết kiệm 22% so với mua 1 tháng',
        'Truy cập sớm các truyện mới',
      ],
      isActive: true,
    },
    {
      id: 'PREMIUM_ANNUAL',
      code: 'PREMIUM_ANNUAL',
      name: 'Premium 1 Năm',
      price: 480000,
      durationDays: 365,
      benefits: [
        'Nghe không giới hạn tất cả truyện',
        'Chất lượng âm thanh lossless',
        'Tải offline không giới hạn',
        'Không quảng cáo hoàn toàn',
        'Hỗ trợ ưu tiên 24/7',
        'Tiết kiệm 32% so với mua 1 tháng',
        'Truy cập sớm các truyện mới',
        'Quà tặng đặc biệt mỗi tháng',
      ],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    try {
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { code: plan.code },
      });

      if (existingPlan) {
        console.log(`✅ Plan ${plan.code} already exists, skipping...`);
        continue;
      }

      await prisma.subscriptionPlan.create({
        data: plan,
      });
      console.log(`✅ Created plan: ${plan.code} - ${plan.name}`);
    } catch (error) {
      console.error(`❌ Error creating plan ${plan.code}:`, error);
    }
  }

  console.log('🎉 Premium Plans seeding completed!');
}

seedPremiumPlans()
  .catch((error) => {
    console.error('❌ Error seeding premium plans:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });