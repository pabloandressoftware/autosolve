import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ServiceCategory } from '@prisma/client';

export class QueryServicesDto {
  /** Texto libre del buscador: «¿Qué servicio necesitas? (ej. cambio de aceite)». */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  q?: string;

  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
