import { Module } from '@nestjs/common';
import { SocialLinksController } from './social-links.controller';
import { PublicSocialLinksController } from './public-social-links.controller';
import { SocialLinksService } from './social-links.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialLinksController, PublicSocialLinksController],
  providers: [SocialLinksService],
  exports: [SocialLinksService],
})
export class SocialLinksModule {}
