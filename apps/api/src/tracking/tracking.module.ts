import { Global, Module } from '@nestjs/common';

import { TrackingBus } from './tracking.bus';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Global()
@Module({
  controllers: [TrackingController],
  providers: [TrackingBus, TrackingService],
  exports: [TrackingBus, TrackingService],
})
export class TrackingModule {}
