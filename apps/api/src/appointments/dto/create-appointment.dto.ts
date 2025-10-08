import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  serviceId!: string;

  @IsUUID()
  workshopId!: string;

  @Type(() => Date)
  @IsDate({ message: 'La fecha de la cita no es válida' })
  scheduledAt!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
