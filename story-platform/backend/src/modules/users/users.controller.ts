import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { UpdateMyProfileDto, ChangeMyPasswordDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipThrottle } from '@nestjs/throttler';

const AVATARS_DIR = path.resolve(process.cwd(), 'uploads/avatars');

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

@ApiTags('Members / Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản & hồ sơ người dùng đang đăng nhập' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getUserProfileResponse(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ cá nhân (displayName, username)' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu người dùng' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeMyPasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tải lên ảnh đại diện mới (JPG, PNG, WEBP, tối đa 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: AVATARS_DIR,
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `avatar_${req.user?.['id'] || 'usr'}_${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype.toLowerCase())) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException({
              code: 'UNSUPPORTED_MEDIA_TYPE',
              message: 'Chỉ chấp nhận tập tin ảnh định dạng JPEG, PNG, WEBP hoặc GIF.',
            }),
            false,
          );
        }
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng chọn một tập tin ảnh để tải lên.',
      });
    }

    const avatarUrl = `/api/v1/users/avatars/${file.filename}`;
    return this.usersService.updateAvatar(userId, avatarUrl);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa ảnh đại diện hiện tại' })
  async deleteAvatar(@CurrentUser('id') userId: string) {
    return this.usersService.updateAvatar(userId, null);
  }

  @Get('avatars/:filename')
  @ApiOperation({ summary: 'Xem tập tin ảnh đại diện' })
  async getAvatarFile(@Param('filename') filename: string, @Res() res: Response) {
    // Sanitize filename against path traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(AVATARS_DIR, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Tập tin ảnh đại diện không tồn tại.',
        },
      });
    }

    return res.sendFile(filePath);
  }
}
