import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}
