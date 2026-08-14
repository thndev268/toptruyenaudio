import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
