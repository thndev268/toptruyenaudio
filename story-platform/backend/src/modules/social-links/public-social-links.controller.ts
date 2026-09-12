import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SocialLinksService } from './social-links.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Social Media Links')
@Controller('social-links')
export class PublicSocialLinksController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy social media links đang active (public)' })
  async getActive() {
    return this.socialLinksService.getActive();
  }
}
