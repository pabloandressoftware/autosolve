import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        phone: dto.phone,
        passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      },
    });

    return this.buildSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // Mensaje deliberadamente genérico: no revelamos si el correo existe.
    const invalid = new UnauthorizedException('Correo o contraseña incorrectos');

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw invalid;
    }

    return this.buildSession(user);
  }

  private buildSession(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
  }) {
    return {
      accessToken: this.jwt.sign(
        { sub: user.id, email: user.email },
        { expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '7d') },
      ),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
      },
    };
  }
}
