import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Deja pasar la petición aunque no haya token. Se usa en las pantallas que el
 * prototipo permite ver con «Explorar sin cuenta», donde el contenido se
 * personaliza solo si hay sesión.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user || (undefined as TUser);
  }
}
