import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { Story, StorySchema } from './schemas/story.schema';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { Genre, GenreSchema } from './schemas/genre.schema';
import { ContentRights, ContentRightsSchema } from './schemas/content-rights.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: ContentRights.name, schema: ContentRightsSchema },
    ]),
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
