import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { ProfanityFilterService } from './profanity-filter.service';
import { OpenAIModerationService } from './openai-moderation.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [CommentsService, ProfanityFilterService, OpenAIModerationService],
  exports: [CommentsService],
})
export class CommentsModule {}
