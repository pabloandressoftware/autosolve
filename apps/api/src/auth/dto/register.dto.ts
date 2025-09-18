import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/[A-Za-z]/, { message: 'La contraseña debe incluir al menos una letra' })
  @Matches(/\d/, { message: 'La contraseña debe incluir al menos un número' })
  password!: string;

  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
