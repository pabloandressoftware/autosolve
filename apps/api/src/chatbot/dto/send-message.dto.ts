import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  @MinLength(2, { message: 'Cuéntanos un poco más sobre la falla' })
  @MaxLength(500)
  content!: string;
}

export class StartSessionDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
