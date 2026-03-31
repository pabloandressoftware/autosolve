import { Controller, Get, MessageEvent, Param, Sse } from '@nestjs/common';
import { Observable, map } from 'rxjs';

import { TrackingBus, TrackingUpdate } from './tracking.bus';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly tracking: TrackingService,
    private readonly bus: TrackingBus,
  ) {}

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.tracking.findByCode(code);
  }

  /** Stream SSE que alimenta la pantalla de seguimiento en tiempo real. */
  @Sse(':code/stream')
  async stream(@Param('code') code: string): Promise<Observable<MessageEvent>> {
    const appointmentId = await this.tracking.findIdByCode(code);

    return this.bus
      .streamFor(appointmentId)
      .pipe(map((update: TrackingUpdate) => ({ data: update }) as MessageEvent));
  }
}
