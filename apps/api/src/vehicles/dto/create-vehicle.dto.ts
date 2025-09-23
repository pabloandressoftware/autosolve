import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const MAX_YEAR = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  /** Placa colombiana: tres letras y tres dígitos (ABC123) o dos dígitos y una letra (motos). */
  @IsString()
  @Transform(({ value }) => String(value).toUpperCase().replace(/[\s-]/g, ''))
  @Matches(/^[A-Z]{3}\d{2}[A-Z0-9]$/, { message: 'La placa debe tener el formato ABC123' })
  plate!: string;

  @IsString()
  brand!: string;

  @IsString()
  model!: string;

  @IsInt()
  @Min(1950, { message: 'El año debe ser 1950 o posterior' })
  @Max(MAX_YEAR, { message: `El año no puede ser mayor a ${MAX_YEAR}` })
  year!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileageKm?: number;
}
