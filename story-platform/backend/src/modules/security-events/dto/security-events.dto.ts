import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SecurityEventStatus } from '../../../common/enums';

export class ActionSecurityEventDto {
  @ApiProperty({ example: 'Thu hồi toàn bộ Refresh Token của tài khoản bị nghi vấn', description: 'Hành động được thực thi' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng mô tả hành động đã thực hiện.' })
  actionTaken: string;

  @ApiProperty({ example: 'Cần thiết để ngăn chặn tấn công giả mạo', description: 'Lý do xử lý' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lý do thực hiện hành động.' })
  reason: string;
}

export class ResolveSecurityEventDto {
  @ApiProperty({ enum: [SecurityEventStatus.RESOLVED, SecurityEventStatus.FALSE_POSITIVE], example: SecurityEventStatus.RESOLVED })
  @IsEnum([SecurityEventStatus.RESOLVED, SecurityEventStatus.FALSE_POSITIVE], { message: 'Trạng thái giải quyết không hợp lệ.' })
  status: SecurityEventStatus.RESOLVED | SecurityEventStatus.FALSE_POSITIVE;

  @ApiProperty({ example: 'Đã xác minh chủ sở hữu thay đổi thiết bị hợp lệ, không có dấu hiệu chiếm đoạt', description: 'Kết luận điều tra' })
  @IsString()
  @IsNotEmpty({ message: 'Kết luận điều tra không được để trống.' })
  resolutionNote: string;

  @ApiProperty({ example: 'Đã yêu cầu người dùng xác minh mật khẩu qua email', description: 'Biện pháp khắc phục đã áp dụng' })
  @IsString()
  @IsNotEmpty({ message: 'Biện pháp xử lý không được để trống.' })
  actionTaken: string;

  @ApiProperty({ example: 'Đã hoàn tất kiểm tra nhật ký truy cập', description: 'Lý do đóng cảnh báo' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống.' })
  reason: string;
}

export class ReopenSecurityEventDto {
  @ApiProperty({ example: 'Phát hiện thêm log truy cập bất thường mới từ IP cũ', description: 'Lý do mở lại cảnh báo' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do mở lại cảnh báo không được để trống.' })
  reason: string;
}
