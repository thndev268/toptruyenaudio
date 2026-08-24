import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PayOSConfigDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsOptional()
  checksumKey?: string;
}

export class UpdatePayOSConfigDto extends PayOSConfigDto {
  @IsString()
  @IsOptional()
  id?: string;
}
