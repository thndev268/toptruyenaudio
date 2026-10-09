import { Module } from '@nestjs/common';
import { ListeningController } from './listening.controller';
import { ListeningService } from './listening.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StoriesModule } from '../stories/stories.module';
import { InMemoryListeningProgressRepository } from './in-memory-progress.repository';

@Module({
  imports: [
    PrismaModule,
    StoriesModule,
  ],
  controllers: [ListeningController],
  providers: [ListeningService, InMemoryListeningProgressRepository],
  exports: [ListeningService],
})
export class ListeningModule {}
