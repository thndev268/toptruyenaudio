import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Backfill script for old video stories that are missing chapters
 * This script creates Chapter 1 for video stories that have iframeUrl/iframeCode but no chapters
 */

async function backfillVideoChapters() {
  console.log('[Backfill Chapters] Đang khởi tạo backfill các chương video...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  
  try {
    const prisma = app.get(PrismaService);
    console.log('Starting backfill for video stories missing chapters...');
    
    // Find all video stories with iframe but no chapters
    const videoStoriesWithoutChapters = await prisma.story.findMany({
      where: {
        isVideoStory: true,
        OR: [
          { iframeUrl: { not: null } },
          { iframeCode: { not: null } },
        ],
      },
      include: {
        chapters: true,
      },
    });
    
    const storiesNeedingChapters = videoStoriesWithoutChapters.filter(
      (story) => story.chapters.length === 0
    );
    
    console.log(`Found ${storiesNeedingChapters.length} video stories without chapters`);
    
    let createdCount = 0;
    let errorCount = 0;
    
    for (const story of storiesNeedingChapters) {
      try {
        const chapter = await prisma.chapter.create({
          data: {
            storyId: story.id,
            number: 1,
            title: `Tập 1: ${story.title}`,
            slug: `${story.slug}-tap-1`,
            videoIframeUrl: story.iframeUrl,
            iframeCode: story.iframeCode,
            durationSeconds: 1800, // Default 30 minutes
            accessLevel: 'FREE',
            publishStatus: 'PUBLISHED',
          },
        });
        
        console.log(`✓ Created Chapter 1 for story: ${story.title} (ID: ${story.id})`);
        createdCount++;
      } catch (error) {
        console.error(`✗ Failed to create chapter for story: ${story.title} (ID: ${story.id})`, error);
        errorCount++;
      }
    }
    
    console.log(`\nBackfill complete:`);
    console.log(`- Created: ${createdCount} chapters`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${storiesNeedingChapters.length}`);
    
    console.log('[Backfill Chapters] Đã hoàn thành backfill!');
    process.exit(0);
  } catch (error) {
    console.error('[Backfill Chapters] Thất bại:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the backfill
backfillVideoChapters();
