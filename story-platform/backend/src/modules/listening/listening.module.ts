import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListeningController } from './listening.controller';
import { ListeningService } from './listening.service';
import { ListeningSession, ListeningSessionSchema } from './schemas/listening-session.schema';
import { ListeningProgress, ListeningProgressSchema } from './schemas/listening-progress.schema';
import { StoriesModule } from '../stories/stories.module';
import { InMemoryListeningProgressRepository } from './in-memory-progress.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ListeningSession.name, schema: ListeningSessionSchema },
      { name: ListeningProgress.name, schema: ListeningProgressSchema },
    ]),
    StoriesModule,
  ],
  controllers: [ListeningController],
  providers: [ListeningService, InMemoryListeningProgressRepository],
  exports: [ListeningService],
})
export class ListeningModule {}
