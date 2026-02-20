import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const prisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token-firmado') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('7d') } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    const dto = {
      email: '  Camila@Autosolve.CO ',
      password: 'Segura123',
      fullName: ' Camila Rueda ',
    };

    it('normaliza el correo, hashea la contraseña y devuelve la sesión', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: { data: Record<string, string> }) =>
        Promise.resolve({ id: 'u1', ...data, phone: null }),
      );

      const result = await service.register(dto);

      const created = prisma.user.create.mock.calls[0][0].data;
      expect(created.email).toBe('camila@autosolve.co');
      expect(created.fullName).toBe('Camila Rueda');
      expect(created.passwordHash).not.toBe(dto.password);
      await expect(bcrypt.compare(dto.password, created.passwordHash)).resolves.toBe(true);

      expect(result.accessToken).toBe('token-firmado');
      expect(result.user).toEqual({
        id: 'u1',
        email: 'camila@autosolve.co',
        fullName: 'Camila Rueda',
        phone: null,
      });
    });

    it('nunca expone el hash de la contraseña', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'camila@autosolve.co',
        fullName: 'Camila Rueda',
        phone: null,
        passwordHash: 'hash-secreto',
      });

      const result = await service.register(dto);

      expect(JSON.stringify(result)).not.toContain('hash-secreto');
    });

    it('rechaza un correo ya registrado', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('acepta credenciales válidas', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'camila@autosolve.co',
        fullName: 'Camila Rueda',
        phone: null,
        passwordHash: await bcrypt.hash('Segura123', 10),
      });

      const result = await service.login({ email: 'camila@autosolve.co', password: 'Segura123' });

      expect(result.accessToken).toBe('token-firmado');
    });

    it('usa el mismo mensaje para usuario inexistente y contraseña incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const sinUsuario = await service
        .login({ email: 'nadie@autosolve.co', password: 'Segura123' })
        .catch((e: Error) => e);

      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'camila@autosolve.co',
        fullName: 'Camila Rueda',
        phone: null,
        passwordHash: await bcrypt.hash('OtraClave123', 10),
      });
      const claveMala = await service
        .login({ email: 'camila@autosolve.co', password: 'Segura123' })
        .catch((e: Error) => e);

      expect(sinUsuario).toBeInstanceOf(UnauthorizedException);
      expect(claveMala).toBeInstanceOf(UnauthorizedException);
      expect((sinUsuario as Error).message).toBe((claveMala as Error).message);
    });
  });
});
